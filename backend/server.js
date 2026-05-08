import express from 'express';
// Heartbeat restart trigger
import User from './models/User.js';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Middlewares
import { checkSystemStatus } from './middleware/systemMiddleware.js';
import errorMiddleware from './middleware/errorMiddleware.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import hubRoutes from './routes/hubRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import vibesRoutes from './routes/vibesRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import registerGameHandlers from './sockets/gameSocket.js';

dotenv.config();

const app = express();
app.use(morgan('dev'));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Basic Middlewares
app.use(cors());
app.use(express.json());

// Attach socket.io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// GLOBAL SYSTEM CHECKS (Bans, Maintenance)
app.use(checkSystemStatus);

// Apply Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hubs', hubRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/vibes', vibesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/games', gameRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err.stack) console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
  // USER INITIAL SETUP
  socket.on('setup', async (userData) => {
    if (!userData?._id) return;
    const isSuperAdmin = userData.role === 'superadmin';
    
    socket.join(userData._id);
    socket.join(userData.batchId);
    if (isSuperAdmin) socket.join('global_admin');

    socket.userId = userData._id;
    socket.batchId = userData.batchId;
    socket.role = userData.role;

    await User.findByIdAndUpdate(userData._id, { isOnline: true });
    
    // Broadcast Presence
    // 1. Update Batch Room
    const batchOnline = await User.find({ batchId: userData.batchId, isOnline: true })
      .select('fullName avatarUrl username');
    io.to(userData.batchId).emit('online_users_update', batchOnline);

    // 2. If SuperAdmin or needed by SuperAdmin, update global room
    const globalOnline = await User.find({ isOnline: true })
      .select('fullName avatarUrl username role batchId');
    io.to('global_admin').emit('online_users_update', globalOnline);

    console.log(`👤 User connected: ${userData.fullName} (${userData.role})`);
  });

  // HUBS & CHANNELS ROOMS
  socket.on('hub:join', ({ hubId, channelId }) => {
    const room = `hub_${hubId}_ch_${channelId}`;
    socket.join(room);
    console.log(`📡 User joined hub room: ${room}`);
  });

  socket.on('hub:leave', ({ hubId, channelId }) => {
    socket.leave(`hub_${hubId}_ch_${channelId}`);
  });

  socket.on('hub:newMessage', (message) => {
    const room = `hub_${message.hubId}_ch_${message.channelId}`;
    socket.to(room).emit('hub:messageReceived', message);
  });

  socket.on('hub:typing', ({ hubId, channelId, user }) => {
    const room = `hub_${hubId}_ch_${channelId}`;
    socket.to(room).emit('hub:typingUpdate', { user, isTyping: true });
  });

  // PRIVATE MESSAGING (DMs)
  socket.on('dm:join', (conversationId) => {
    socket.join(conversationId);
    console.log(`💬 User joined DM room: ${conversationId}`);
  });

  socket.on('dm:newMessage', (message) => {
    // Emit to the conversation room (chatId)
    if (message.chatId) {
      socket.to(message.chatId).emit('dm:messageReceived', message);
    }
    // Also emit a notification to the specific receiver's personal room
    if (message.receiver) {
      socket.to(message.receiver).emit('dm:newNotification', message);
    }
  });

  // GAMES LOGIC
  registerGameHandlers(io, socket);

  // GLOBAL EMERGENCY ALERT (Superadmin only)
  socket.on('admin:broadcastAlert', (alertData) => {
    // Only trust if sender has high role (validation can be added)
    io.emit('global:alert', alertData);
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: Date.now() });
      
      // Update Batch Room
      const batchOnline = await User.find({ batchId: socket.batchId, isOnline: true })
        .select('fullName avatarUrl username');
      io.to(socket.batchId).emit('online_users_update', batchOnline);

      // Update Global Admin Room
      const globalOnline = await User.find({ isOnline: true })
        .select('fullName avatarUrl username role batchId');
      io.to('global_admin').emit('online_users_update', globalOnline);

      console.log(`👤 User disconnected: ${socket.userId}`);
    }
  });
});

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/daf3tna';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Start Server regardless of initial DB status to prevent "Early Exit"
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/auth/login (for local)`);
});
