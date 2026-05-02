import express from 'express';
import Hub from '../models/Hub.js';
import Message from '../models/Message.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all hubs for user's batch
router.get('/', protect, async (req, res) => {
  try {
    const hubs = await Hub.find({ batchId: req.user.batchId })
      .populate('admin', 'fullName avatarUrl username');
    res.json(hubs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new hub (within same batch)
router.post('/', protect, async (req, res) => {
  const { name, category, color, icon, description, textChannels, voiceChannels } = req.body;
  if (!name) return res.status(400).json({ message: 'اسم الغرفة مطلوب' });

  try {
    const hub = new Hub({
      name, category, color, icon, description,
      textChannels: textChannels || ['الدردشة-العامة'],
      voiceChannels: voiceChannels || [],
      admin: req.user._id,
      batchId: req.user.batchId,
      members: [req.user._id]
    });
    const createdHub = await hub.save();
    const populated = await createdHub.populate('admin', 'fullName avatarUrl username');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join a hub (BATCH ISOLATION: only same-batch hubs)
router.post('/:id/join', protect, async (req, res) => {
  try {
    const hub = await Hub.findOneAndUpdate(
      { _id: req.params.id, batchId: req.user.batchId },
      { $addToSet: { members: req.user._id } },
      { new: true }
    ).populate('admin', 'fullName avatarUrl username');
    
    if (!hub) return res.status(404).json({ message: 'الغرفة غير موجودة أو غير متاحة لدفعتك' });
    res.json(hub);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a specific channel (BATCH ISOLATION)
router.get('/:id/channels/:channelName/messages', protect, async (req, res) => {
  try {
    // Verify hub belongs to user's batch
    const hub = await Hub.findOne({ _id: req.params.id, batchId: req.user.batchId });
    if (!hub) return res.status(403).json({ message: 'Access denied' });

    const messages = await Message.find({
      hubId: req.params.id,
      channelName: req.params.channelName
    })
      .populate('sender', 'fullName avatarUrl username')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
