import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { 
  updateProfile, getProfile, toggleFollow, 
  acceptFollowRequest, rejectFollowRequest 
} from '../controllers/userController.js';
import User from '../models/User.js';

const router = express.Router();

// Me - Restore Session
router.get('/me', protect, (req, res) => res.json(req.user));

// Yearbook - Get all users in batch (Optimized)
router.get('/batch', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? {} : { batchId: req.user.batchId };
    
    const users = await User.find(query)
      .select('fullName username avatarUrl bio major followers following isPrivate')
      .sort({ fullName: 1 })
      .lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Profile Update with Cloudinary
router.put('/profile', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
  ]), updateProfile);
  
// Get Profile by Username
router.get('/:username', protect, getProfile);

// Search (Optimized)
router.get('/search', protect, async (req, res) => {
  const { name, username } = req.query;
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? {} : { batchId: req.user.batchId };
    if (username) query.username = { $regex: `^${username}`, $options: 'i' }; // Partial match from start
    else if (name) query.fullName = { $regex: name, $options: 'i' };
    else return res.status(400).json({ message: 'يجب إدخال اسم أو يوزرنيم' });

    const users = await User.find(query)
      .select('fullName username avatarUrl bio major followers isPrivate')
      .limit(15)
      .lean();

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search History
router.get('/search-history', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('searchHistory', 'fullName username avatarUrl bio major');
  res.json(user.searchHistory || []);
});

router.post('/search-history', protect, async (req, res) => {
  const { userId } = req.body;
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { searchHistory: userId } });
  res.json({ success: true });
});

router.delete('/search-history', protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { searchHistory: [] } });
  res.json({ success: true });
});

router.delete('/search-history/:id', protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { searchHistory: req.params.id } });
  res.json({ success: true });
});

// Follow Routes
router.post('/:id/follow', protect, toggleFollow);
router.post('/:id/accept-request', protect, acceptFollowRequest);
router.post('/:id/reject-request', protect, rejectFollowRequest);

export default router;
