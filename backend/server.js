import express from 'express';
import User from './models/User.js';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import path from 'path';
import { fileURLToPath } from 'url';
import initCronJobs from './utils/cronJobs.js';

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
initCronJobs();

import rateLimit from 'express-rate-limit';

const app = express();

// Rate Limiting to prevent spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'طلب زائد، يرجى المحاولة بعد قليل' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(compression());
app.use('/api/', limiter);
app.use(morgan('dev'));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: 10000,
  pingTimeout: 5000,
  connectTimeout: 10000
});

// Redis Adapter for scalability
if (process.env.REDIS_URL) {
  try {
    const pubClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 10000
    });
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('📡 Socket.io Redis Adapter enabled');
  } catch (e) {
    console.error('⚠️ Redis Socket Adapter failed to connect:', e.message);
  }
}

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health Check Endpoint (Lightweight & Public - Place before status middlewares)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use(checkSystemStatus);

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

app.use(errorMiddleware);

// --- SOCKET LOGIC (Optimized) ---
io.on('connection', (socket) => {
  socket.on('setup', async (userData) => {
    if (!userData?._id) return;
    const isSuperAdmin = userData.role === 'superadmin';
    
    socket.join(userData._id);
    socket.join(userData.batchId);
    if (isSuperAdmin) socket.join('global_admin');

    socket.userId = userData._id;
    socket.batchId = userData.batchId;
    socket.role = userData.role;
    
    // Performance: Use updateOne to minimize overhead
    try {
      await User.updateOne({ _id: userData._id }, { isOnline: true });
    } catch (err) {
      console.error('Error updating user status:', err);
    }
    
    const [batchOnline, globalOnline] = await Promise.all([
      User.find({ batchId: userData.batchId, isOnline: true }).select('fullName profilePicture username').lean(),
      isSuperAdmin ? User.find({ isOnline: true }).select('fullName profilePicture username role batchId').lean() : Promise.resolve(null)
    ]);

    io.to(userData.batchId).emit('online_users_update', batchOnline);
    if (isSuperAdmin && globalOnline) {
      io.to('global_admin').emit('online_users_update', globalOnline);
    }
    console.log(`👤 User connected: ${userData.fullName}`);
  });

  socket.on('hub:join', ({ hubId, channelId }) => {
    socket.join(`hub_${hubId}_ch_${channelId}`);
  });

  socket.on('hub:leave', ({ hubId, channelId }) => {
    socket.leave(`hub_${hubId}_ch_${channelId}`);
  });

  socket.on('hub:newMessage', (message) => {
    socket.to(`hub_${message.hubId}_ch_${message.channelId}`).emit('hub:messageReceived', message);
  });

  socket.on('dm:join', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('dm:newMessage', (message) => {
    if (message.chatId) socket.to(message.chatId).emit('dm:messageReceived', message);
    if (message.receiver) socket.to(message.receiver).emit('dm:newNotification', message);
  });

  registerGameHandlers(io, socket);

  socket.on('disconnect', async () => {
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: Date.now() });
      const batchOnline = await User.find({ batchId: socket.batchId, isOnline: true }).select('fullName profilePicture username').lean();
      io.to(socket.batchId).emit('online_users_update', batchOnline);
      if (socket.role === 'superadmin') {
        const globalOnline = await User.find({ isOnline: true }).select('fullName profilePicture username role batchId').lean();
        io.to('global_admin').emit('online_users_update', globalOnline);
      }
    }
  });
});

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/daf3tna';

// Optimization: Start Server Immediately, then connect DB
httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
  }
});
