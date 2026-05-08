import express from 'express';
import Story from '../models/Story.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload, uploadToCloudinary } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get active stories (Optimized)
router.get('/', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? {} : { batchId: req.user.batchId };
    
    const stories = await Story.find(query)
      .populate('user', 'fullName avatarUrl username')
      .sort('-createdAt')
      .lean();
    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create story with Cloudinary
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'يجب رفع صورة' });
    
    const result = await uploadToCloudinary(req.file.buffer, 'stories');
    
    const story = await Story.create({
      user: req.user._id,
      batchId: req.user.batchId,
      mediaUrl: result.secure_url,
      mediaPublicId: result.public_id
    });
    
    const populated = await story.populate('user', 'fullName avatarUrl username');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// View Story
router.post('/:id/view', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'غير موجود' });

    if (!story.viewers.includes(req.user._id)) {
      story.viewers.push(req.user._id);
      await story.save();
    }
    res.json(story);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Story
router.delete('/:id', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'القصة غير موجودة' });

    // Check ownership or admin status
    const isOwner = story.user.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin', 'moderator'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'غير مصرح لك بحذف هذه القصة' });
    }

    // Optional: Delete from Cloudinary if mediaPublicId exists
    // (Needs cloudinary import and config, which is in uploadMiddleware/server.js)
    // For now, let's just delete from DB as requested, 
    // but ensure the ownership check is solid.
    
    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف القصة بنجاح' });
  } catch (err) {
    console.error('Delete Story Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
