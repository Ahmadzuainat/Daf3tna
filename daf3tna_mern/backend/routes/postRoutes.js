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

// Profile Posts
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'fullName avatarUrl username')
      .sort('-createdAt')
      .lean();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Post
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'غير مسموح' });
    }
    await Post.findByIdAndDelete(req.params.id);
    req.io.to(req.user.batchId).emit('post_deleted', req.params.id);
    res.json({ message: 'تم الحذف' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
