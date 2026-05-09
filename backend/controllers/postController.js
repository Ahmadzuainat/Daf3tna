import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';
import { getCache, setCache } from '../utils/cacheManager.js';

// @desc    Get Feed Posts (Paginated & Optimized)
export const getFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { user } = req;
  const cacheKey = `feed_${user.batchId}_${page}_${limit}_${user.role}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) return res.json(cachedData);

  // 1. Get the list of IDs I follow
  const currentUser = await User.findById(user._id).select('following').lean();
  const followingIds = currentUser?.following || [];

  // 2. Build optimized query
  const batchQuery = user.role === 'superadmin' ? {} : { batchId: user.batchId };
  
  // Get all public users in this batch to include in query
  const publicUsers = await User.find({ ...batchQuery, isPrivate: false }).select('_id').lean();
  const publicIds = publicUsers.map(u => u._id);
  
  const finalQuery = {
    ...batchQuery,
    user: { $in: [...followingIds, user._id, ...publicIds] }
  };

  const skip = (Number(page) - 1) * Number(limit);

  // 3. Optimized query with DB-level filtering
  const posts = await Post.find(finalQuery)
    .populate('user', 'fullName username avatarUrl isPrivate')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))
    .select('-mediaPublicIds -__v')
    .lean();

  const total = await Post.countDocuments(finalQuery);

  const responseData = {
    success: true,
    data: posts,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    }
  };

  // Cache for 60 seconds (feed is dynamic, but 1 min is enough for burst load)
  await setCache(cacheKey, responseData, 60);

  res.json(responseData);
});

// @desc    Create Post with Cloudinary
export const createPost = asyncHandler(async (req, res) => {
  const { text, mediaUrls: bodyMediaUrls } = req.body;
  let mediaUrls = Array.isArray(bodyMediaUrls) ? bodyMediaUrls : [];
  const mediaPublicIds = [];

  // Handle direct file uploads if any
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, 'posts');
      mediaUrls.push(result.secure_url);
      mediaPublicIds.push(result.public_id);
    }
  }

  const post = await Post.create({
    user: req.user._id,
    batchId: req.user.batchId,
    text,
    mediaUrls,
    mediaPublicIds
  });

  const populatedPost = await post.populate('user', 'fullName username avatarUrl');
  
  // Emit to batch room via socket (req.io)
  req.io.to(req.user.batchId).emit('new_post', populatedPost);

  res.status(201).json({ success: true, data: populatedPost });
});

// @desc    Like/Unlike Post
export const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });

  const index = post.likes.indexOf(req.user._id);
  if (index === -1) {
    post.likes.push(req.user._id);
  } else {
    post.likes.splice(index, 1);
  }

  await post.save();
  res.json({ success: true, likesCount: post.likes.length });
});

// @desc    Add Comment
export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'التعليق فارغ' });

  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });

  const comment = await Comment.create({
    post: req.params.id,
    user: req.user._id,
    text
  });

  post.commentsCount += 1;
  await post.save();

  const populated = await comment.populate('user', 'fullName avatarUrl username');
  res.status(201).json(populated);
});

// @desc    Get Post with Comments
export const getPostDetails = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('user', 'fullName username avatarUrl isPrivate followers');
  if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });

  // Privacy Check
  if (post.user.isPrivate && 
      post.user._id.toString() !== req.user._id.toString() && 
      !post.user.followers.some(f => f.toString() === req.user._id.toString())) {
    return res.status(403).json({ message: 'هذا الحساب خاص' });
  }

  const comments = await Comment.find({ post: req.params.id })
    .populate('user', 'fullName avatarUrl username')
    .sort('createdAt');

  res.json({ ...post.toObject(), comments });
});
