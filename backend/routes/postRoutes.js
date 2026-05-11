import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { getFeed, createPost, toggleLike, getPostDetails, addComment } from '../controllers/postController.js';
import Post from '../models/Post.js';

const router = express.Router();

// Get paginated feed
router.get('/', protect, getFeed);

// Get post details with comments
router.get('/:id', protect, getPostDetails);

// Create post with media (Cloudinary)
router.post('/', protect, upload.array('media', 4), createPost);

// Like/Unlike
router.put('/:id/like', protect, toggleLike);

// Comment
router.post('/:id/comment', protect, addComment);

// Profile Posts (Optimized with Pagination)
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'fullName avatarUrl username')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit Post
router.put('/:id', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post || post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'غير مسموح' });
    }
    post.text = text || post.text;
    await post.save();
    
    const updated = await Post.findById(req.params.id).populate('user', 'fullName avatarUrl username');
    req.io.to(req.user.batchId).emit('post_updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Post
router.delete('/:id', protect, async (req, res) => {
  try {
    const isModerator = ['superadmin', 'admin', 'moderator'].includes(req.user.role);
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });

    const isOwner = post.user.toString() === req.user._id.toString();
    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'غير مصرح لك بحذف هذا المنشور' });
    }

    await Post.findByIdAndDelete(req.params.id);
    req.io.to(post.batchId).emit('post_deleted', req.params.id);
    res.json({ message: 'تم حذف المنشور بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Comment
router.delete('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const isModerator = ['superadmin', 'admin', 'moderator'].includes(req.user.role);
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'التعليق غير موجود' });

    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isPostOwner = post.user.toString() === req.user._id.toString();

    if (!isCommentOwner && !isPostOwner && !isModerator) {
      return res.status(403).json({ message: 'غير مصرح لك بحذف هذا التعليق' });
    }

    post.comments.pull(req.params.commentId);
    await post.save();
    res.json({ message: 'تم حذف التعليق بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
