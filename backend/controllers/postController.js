import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';

// @desc    Get Feed Posts (Paginated)
export const getFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { user } = req;
  const isSuperAdmin = user.role === 'superadmin';
  const query = isSuperAdmin ? {} : { batchId: user.batchId };

  // Filter posts from private accounts that the user doesn't follow
  // Exception: My own posts
  const posts = await Post.find(query)
    .populate('user', 'fullName username avatarUrl isPrivate followers')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  const isAdmin = ['admin', 'superadmin', 'moderator'].includes(user.role);

  const filteredPosts = posts.filter(post => {
    if (!post.user) return false; // Handle deleted users
    if (isAdmin) return true;
    if (post.user._id.toString() === user._id.toString()) return true;
    if (!post.user.isPrivate) return true;
    return (post.user.followers || []).some(f => f.toString() === user._id.toString());
  });

  const total = await Post.countDocuments(query);

  res.json({
    success: true,
    data: posts,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    }
  });
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

  // Privacy Check (Exempt Admins/Superadmins/Moderators)
  const isAdmin = ['admin', 'superadmin', 'moderator'].includes(req.user.role);
  
  if (!post.user) {
    // If post user is missing, only admins can see details or we just allow it as a "ghost" post
    if (!isAdmin) return res.status(404).json({ message: 'صاحب المنشور غير موجود' });
  } else if (!isAdmin && post.user.isPrivate && 
      post.user._id.toString() !== req.user._id.toString() && 
      !post.user.followers.some(f => f.toString() === req.user._id.toString())) {
    return res.status(403).json({ message: 'هذا الحساب خاص' });
  }

  const comments = await Comment.find({ post: req.params.id })
    .populate('user', 'fullName avatarUrl username')
    .sort('createdAt');

  res.json({ ...post.toObject(), comments });
});
