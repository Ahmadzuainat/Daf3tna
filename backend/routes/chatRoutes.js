import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all DM chats for the current user
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'fullName avatarUrl username isOnline')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or fetch a DM chat (BATCH ISOLATION: only same-batch users)
router.post('/', protect, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId مطلوب' });

  try {
    // Verify the other user is in the same batch
    const otherUser = await User.findById(userId).select('batchId fullName');
    if (!otherUser) return res.status(404).json({ message: 'المستخدم غير موجود' });
    const isSuperAdmin = req.user.role === 'superadmin';
    if (!isSuperAdmin && otherUser.batchId !== req.user.batchId) {
      return res.status(403).json({ message: 'لا يمكن مراسلة طلاب من دفعات أخرى' });
    }

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, userId] }
    }).populate('participants', 'fullName avatarUrl username isOnline');

    if (!chat) {
      chat = new Chat({ participants: [req.user._id, userId] });
      await chat.save();
      chat = await Chat.findById(chat._id)
        .populate('participants', 'fullName avatarUrl username isOnline');
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a chat
router.get('/:id/messages', protect, async (req, res) => {
  try {
    // Verify user is a participant
    const chat = await Chat.findOne({ _id: req.params.id, participants: req.user._id });
    if (!chat) return res.status(403).json({ message: 'Access denied' });

    const messages = await Message.find({ chatId: req.params.id })
      .populate('sender', 'fullName avatarUrl username')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark messages in a chat as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, participants: req.user._id });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Reset unreadCount for current user
    chat.unreadCount.set(req.user._id.toString(), 0);
    await chat.save();

    // Mark messages as read
    await Message.updateMany(
      { chatId: req.params.id, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Chat marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// SEND a message to a chat
router.post('/:id/messages', protect, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: 'Content is required' });

  try {
    // 1. Verify chat and participants
    const chat = await Chat.findOne({ _id: req.params.id, participants: req.user._id });
    if (!chat) return res.status(403).json({ message: 'Access denied' });

    // 2. Create message
    const message = new Message({
      sender: req.user._id,
      content,
      chatId: req.params.id,
      isRead: false
    });
    await message.save();

    // 3. Update Chat metadata
    chat.lastMessage = message._id;
    
    // Increment unread count for other participants
    chat.participants.forEach(p => {
      if (p.toString() !== req.user._id.toString()) {
        const currentCount = chat.unreadCount.get(p.toString()) || 0;
        chat.unreadCount.set(p.toString(), currentCount + 1);
      }
    });

    await chat.save();

    const populatedMessage = await message.populate('sender', 'fullName avatarUrl username');
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
