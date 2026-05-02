import express from 'express';
import Hub from '../models/Hub.js';
import Message from '../models/Message.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

import HubMessage from '../models/HubMessage.js';

// Get all hubs for user's batch
router.get('/', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? {} : { batchId: req.user.batchId };
    
    const hubs = await Hub.find(query)
      .populate('admin', 'fullName avatarUrl username');
    res.json(hubs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new hub
router.post('/', protect, async (req, res) => {
  const { name, category, color, icon, description, textChannels, voiceChannels } = req.body;
  if (!name) return res.status(400).json({ message: 'اسم الغرفة مطلوب' });

  try {
    const hub = new Hub({
      name, category, color, icon, description,
      textChannels: textChannels || [{ name: 'العامة' }, { name: 'المناقشات' }],
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

// Join a hub
router.post('/:id/join', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, batchId: req.user.batchId };

    const hub = await Hub.findOneAndUpdate(
      query,
      { $addToSet: { members: req.user._id } },
      { new: true }
    ).populate('admin', 'fullName avatarUrl username');
    
    if (!hub) return res.status(404).json({ message: 'الغرفة غير موجودة أو غير متاحة لدفعتك' });
    res.json(hub);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a specific channel (Discord-like)
router.get('/:hubId/messages/:channelId', protect, async (req, res) => {
  try {
    // 1. Verify hub access
    const isSuperAdmin = req.user.role === 'superadmin';
    const hubQuery = isSuperAdmin ? { _id: req.params.hubId } : { _id: req.params.hubId, batchId: req.user.batchId };
    
    const hub = await Hub.findOne(hubQuery);
    if (!hub) return res.status(403).json({ message: 'لا تملك صلاحية الوصول لهذا المجتمع' });

    // 2. Fetch last 50 messages
    const messages = await HubMessage.find({
      hubId: req.params.hubId,
      channelId: req.params.channelId,
      isDeleted: false
    })
      .populate('sender', 'fullName avatarUrl username')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message to a channel
router.post('/:hubId/messages', protect, async (req, res) => {
  const { channelId, text, mediaUrl, mediaType } = req.body;
  if (!channelId) return res.status(400).json({ message: 'channelId is required' });

  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const hubQuery = isSuperAdmin ? { _id: req.params.hubId } : { _id: req.params.hubId, batchId: req.user.batchId };
    
    const hub = await Hub.findOne(hubQuery);
    if (!hub) return res.status(403).json({ message: 'Hub not found' });

    const newMessage = new HubMessage({
      sender: req.user._id,
      hubId: req.params.hubId,
      channelId,
      text,
      mediaUrl,
      mediaType
    });

    await newMessage.save();
    const populated = await newMessage.populate('sender', 'fullName avatarUrl username');

    // Socket emission will be handled here or in controller
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a message
router.delete('/messages/:id', protect, async (req, res) => {
  try {
    const msg = await HubMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    // Only sender or admin can delete
    if (msg.sender.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    msg.isDeleted = true;
    await msg.save();
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
