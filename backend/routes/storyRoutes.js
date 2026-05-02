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
    const story = await Story.findOne({ _id: req.params.id, user: req.user._id });
    if (!story) return res.status(404).json({ message: 'القصة غير موجودة أو غير مصرح لك بحذفها' });
    
    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف القصة بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
