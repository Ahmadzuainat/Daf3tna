import express from 'express';
import Award from '../models/Award.js';
import Quote from '../models/Quote.js';
import Confession from '../models/Confession.js';
import Panic from '../models/Panic.js';
import Notebook from '../models/Notebook.js';
import Instant from '../models/Instant.js';
import TimeCapsule from '../models/TimeCapsule.js';
import { protect } from '../middleware/authMiddleware.js';
import AdminLog from '../models/AdminLog.js';

const router = express.Router();

/* ============================================================
   AWARDS
============================================================ */
router.get('/awards', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? {} : { batchId: req.user.batchId };
    const awards = await Award.find(query)
      .populate('user', 'fullName avatarUrl username')
      .sort({ createdAt: -1 });
    res.json(awards);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/awards', protect, async (req, res) => {
  const { title, userId, duration } = req.body;
  if (!title || !userId) return res.status(400).json({ message: 'العنوان والمرشح مطلوبان' });

  try {
    // Verify nominee is in same batch
    const award = new Award({
      title, user: userId,
      batchId: req.user.batchId,
      votes: [req.user._id], // creator auto-votes
      duration: duration || '24h'
    });
    await award.save();
    const populated = await award.populate('user', 'fullName avatarUrl username');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on an award (no duplicate votes)
router.post('/awards/:id/vote', protect, async (req, res) => {
  try {
    const award = await Award.findOne({ _id: req.params.id, batchId: req.user.batchId });
    if (!award) return res.status(404).json({ message: 'الجائزة غير موجودة' });

    const userId = req.user._id.toString();
    const alreadyVoted = award.votes.some(v => v.toString() === userId);

    if (alreadyVoted) {
      return res.status(400).json({ message: 'لقد صوّت مسبقاً على هذا اللقب' });
    }

    award.votes.push(req.user._id);
    await award.save();
    const populated = await award.populate('user', 'fullName avatarUrl username');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ============================================================
   QUOTES
============================================================ */
router.get('/quotes', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? {} : { $or: [{ batchId: req.user.batchId }, { batchId: 'all' }] };
    const quotes = await Quote.find(query).sort({ createdAt: -1 });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/quotes', protect, async (req, res) => {
  const { text, doctor, subject } = req.body;
  if (!text || !doctor) return res.status(400).json({ message: 'النص واسم الدكتور مطلوبان' });

  try {
    const quote = new Quote({
      text, doctor, subject,
      batchId: req.user.batchId,
      addedBy: req.user._id
    });
    await quote.save();
    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/quotes/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findOne({ _id: req.params.id, addedBy: req.user._id });
    if (!quote) return res.status(404).json({ message: 'الاقتباس غير موجود أو غير مصرح لك بحذفه' });
    await Quote.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الاقتباس' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ============================================================
   CONFESSIONS (anonymous — user identity never returned)
============================================================ */
router.get('/confessions', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? {} : { batchId: req.user.batchId };
    const confessions = await Confession.find(query)
      .select('text batchId createdAt')
      .sort({ createdAt: -1 });
    res.json(confessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/confessions', protect, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'نص الاعتراف مطلوب' });

  try {
    // Store author for moderation but never expose it in GET
    const confession = new Confession({
      text,
      author: req.user._id, // stored but never returned
      batchId: req.user.batchId
    });
    await confession.save();
    // Return safe version
    res.status(201).json({ _id: confession._id, text: confession.text, createdAt: confession.createdAt });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/confessions/:id', protect, async (req, res) => {
  try {
    const confession = await Confession.findOne({ _id: req.params.id, author: req.user._id });
    if (!confession) return res.status(404).json({ message: 'الاعتراف غير موجود أو غير مصرح لك بحذفه' });
    await Confession.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الاعتراف' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ============================================================
   PANICS
============================================================ */
router.get('/panics', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? { active: true } : { batchId: req.user.batchId, active: true };
    const panics = await Panic.find(query)
      .populate('author', 'fullName avatarUrl username')
      .populate('replies.user', 'fullName avatarUrl username')
      .sort({ createdAt: -1 });
    res.json(panics);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/panics', protect, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'يجب كتابة رسالة الفزعة' });

  try {
    const panic = new Panic({ text, author: req.user._id, batchId: req.user.batchId });
    await panic.save();
    const populated = await panic.populate('author', 'fullName avatarUrl username');

    // Broadcast via socket.io
    if (req.io) {
      req.io.to(req.user.batchId).emit('panic_alert', {
        ...populated.toObject(),
        authorName: req.user.fullName
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/panics/:id', protect, async (req, res) => {
  try {
    const panic = await Panic.findOne({ _id: req.params.id, author: req.user._id });
    if (!panic) return res.status(404).json({ message: 'الفزعة غير موجودة أو غير مصرح لك بحذفها' });
    await Panic.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الفزعة' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/panics/:id/reply', protect, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'الرد لا يمكن أن يكون فارغاً' });

  try {
    const panic = await Panic.findOne({ _id: req.params.id, batchId: req.user.batchId });
    if (!panic) return res.status(404).json({ message: 'الفزعة غير موجودة' });

    panic.replies.push({ user: req.user._id, text });
    await panic.save();

    const updated = await Panic.findById(req.params.id)
      .populate('author', 'fullName avatarUrl username')
      .populate('replies.user', 'fullName avatarUrl username');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ============================================================
   NOTEBOOKS
============================================================ */
router.get('/notebooks', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? {} : { batchId: req.user.batchId };
    const notebooks = await Notebook.find(query)
      .populate('owner', 'fullName avatarUrl username major')
      .populate('messages.author', 'fullName avatarUrl username');
    res.json(notebooks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/notebooks', protect, async (req, res) => {
  const { title, description, color, theme, quote, isPublic } = req.body;
  
  try {
    const existing = await Notebook.findOne({ owner: req.user._id });
    if (existing) return res.status(400).json({ message: 'لديك دفتر بالفعل' });

    const notebook = new Notebook({
      owner: req.user._id,
      batchId: req.user.batchId,
      title, description, color, theme, quote, isPublic
    });
    await notebook.save();
    const populated = await notebook.populate('owner', 'fullName avatarUrl username major');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/notebooks/:id/messages', protect, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'الرسالة لا يمكن أن تكون فارغة' });

  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, batchId: req.user.batchId });
    if (!notebook) return res.status(404).json({ message: 'الدفتر غير موجود' });

    // Cannot write in your own notebook
    if (notebook.owner.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'لا يمكنك الكتابة في دفترك الخاص' });
    }

    notebook.messages.push({ author: req.user._id, text });
    await notebook.save();

    const updated = await Notebook.findById(req.params.id)
      .populate('owner', 'fullName avatarUrl username major')
      .populate('messages.author', 'fullName avatarUrl username');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/notebooks/:id/messages/:msgId', protect, async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, batchId: req.user.batchId });
    if (!notebook) return res.status(404).json({ message: 'الدفتر غير موجود' });
    if (notebook.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'فقط صاحب الدفتر يمكنه الحذف' });
    }

    notebook.messages = notebook.messages.filter(m => m._id.toString() !== req.params.msgId);
    await notebook.save();
    res.json(notebook);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/notebooks/:id', protect, async (req, res) => {
  const { title, description, color, theme, quote, isPublic } = req.body;
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, owner: req.user._id });
    if (!notebook) return res.status(404).json({ message: 'الدفتر غير موجود أو غير مصرح لك' });

    if (title) notebook.title = title;
    if (description) notebook.description = description;
    if (color) notebook.color = color;
    if (theme) notebook.theme = theme;
    if (quote) notebook.quote = quote;
    if (typeof isPublic === 'boolean') notebook.isPublic = isPublic;

    await notebook.save();
    const updated = await Notebook.findById(req.params.id)
      .populate('owner', 'fullName avatarUrl username major')
      .populate('messages.author', 'fullName avatarUrl username');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/notebooks/:id/messages/:msgId/pin', protect, async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, batchId: req.user.batchId });
    if (!notebook) return res.status(404).json({ message: 'الدفتر غير موجود' });
    if (notebook.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'غير مصرح' });
    }

    const msg = notebook.messages.id(req.params.msgId);
    if (msg) {
      msg.isPinned = !msg.isPinned;
      await notebook.save();
    }
    res.json(notebook);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/notebooks/:id/visibility', protect, async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, batchId: req.user.batchId });
    if (!notebook) return res.status(404).json({ message: 'الدفتر غير موجود' });
    if (notebook.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'غير مصرح' });
    }

    notebook.hideAllComments = !notebook.hideAllComments;
    await notebook.save();
    res.json(notebook);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ============================================================
   INSTANTS (Snapchat-like — view once)
   NOTE: Duplicate routes removed. Only one set below.
============================================================ */
router.get('/instants', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? {} : { batchId: req.user.batchId };
    const instants = await Instant.find(query)
      .populate('user', 'fullName avatarUrl username')
      .sort({ createdAt: -1 });
    res.json(instants);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/instants', protect, async (req, res) => {
  const { mediaUrl } = req.body;
  if (!mediaUrl) return res.status(400).json({ message: 'mediaUrl مطلوب' });

  try {
    const instant = new Instant({
      user: req.user._id,
      batchId: req.user.batchId,
      mediaUrl,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6h
    });
    await instant.save();
    const populated = await instant.populate('user', 'fullName avatarUrl username');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// View an instant (once per non-owner user)
router.post('/instants/:id/view', protect, async (req, res) => {
  try {
    const instant = await Instant.findOne({ _id: req.params.id, batchId: req.user.batchId });
    if (!instant) return res.status(404).json({ message: 'اللقطة غير موجودة' });

    const userId = req.user._id.toString();
    const isOwner = instant.user.toString() === userId;
    const alreadyViewed = instant.viewers.some(v => v.toString() === userId);

    if (!isOwner && !alreadyViewed) {
      instant.viewers.push(req.user._id);
      await instant.save();
    }
    res.json(instant);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Like / Unlike an instant
router.post('/instants/:id/like', protect, async (req, res) => {
  try {
    const instant = await Instant.findOne({ _id: req.params.id, batchId: req.user.batchId });
    if (!instant) return res.status(404).json({ message: 'اللقطة غير موجودة' });

    const userId = req.user._id.toString();
    const liked = instant.likes.some(l => l.toString() === userId);

    if (liked) {
      instant.likes = instant.likes.filter(l => l.toString() !== userId);
    } else {
      instant.likes.push(req.user._id);
    }
    await instant.save();
    res.json(instant);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an instant
router.delete('/instants/:id', protect, async (req, res) => {
  try {
    const instant = await Instant.findOne({ _id: req.params.id, user: req.user._id });
    if (!instant) return res.status(404).json({ message: 'اللقطة غير موجودة أو غير مصرح لك بحذفها' });
    await Instant.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف اللقطة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ============================================================
   TIME CAPSULE
============================================================ */
router.get('/time-capsules', protect, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const query = isSuperAdmin ? {} : { 
      batchId: req.user.batchId,
      $or: [
        { author: req.user._id }, 
        { isPublic: true, unlockDate: { $lte: new Date() } }
      ]
    };
    const capsules = await TimeCapsule.find(query).populate('author', 'fullName avatarUrl username');
    res.json(capsules);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/time-capsules', protect, async (req, res) => {
  const { text, mediaUrl, unlockDate, isPublic } = req.body;
  if (!text || !unlockDate) return res.status(400).json({ message: 'النص وتاريخ الفتح مطلوبان' });

  try {
    const capsule = new TimeCapsule({
      author: req.user._id,
      batchId: req.user.batchId,
      text, mediaUrl, unlockDate, isPublic
    });
    await capsule.save();
    const populated = await capsule.populate('author', 'fullName avatarUrl username');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
