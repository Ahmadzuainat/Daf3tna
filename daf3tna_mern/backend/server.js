import express from 'express';
import User from './models/User.js';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
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
  socket.on('setup', async (userData) => {
    if (!userData?._id) return;
    socket.join(userData._id);
    socket.join(userData.batchId);
    socket.userId = userData._id;
    socket.batchId = userData.batchId;

    await User.findByIdAndUpdate(userData._id, { isOnline: true });
    
    // Send list of online users in this batch
    const onlineUsers = await User.find({ batchId: userData.batchId, isOnline: true })
      .select('fullName avatarUrl username');
    io.to(userData.batchId).emit('online_users_update', onlineUsers);

    console.log(`👤 User connected: ${userData.fullName}`);
  });
  
  socket.on('join_room', (room) => socket.join(room));

  socket.on('disconnect', async () => {
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: Date.now() });
      const onlineUsers = await User.find({ batchId: socket.batchId, isOnline: true })
        .select('fullName avatarUrl username');
      io.to(socket.batchId).emit('online_users_update', onlineUsers);
      console.log(`👤 User disconnected: ${socket.userId}`);
    }
  });
});

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/daf3tna';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));
