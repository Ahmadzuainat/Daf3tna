import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  fullName: { type: String, required: true, index: true },
  username: { type: String, required: true, unique: true, index: true },
  university: { type: String, required: true },
  major: { type: String, required: true },
  graduationYear: { type: Number },
  batchId: { type: String, required: true, index: true },
  avatarUrl: { type: String, default: '' },
  avatarPublicId: { type: String },
  coverUrl: { type: String, default: '' },
  coverPublicId: { type: String },
  bio: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  searchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate: { type: Boolean, default: false },
  theme: { type: String, default: 'dark' },
  language: { type: String, default: 'ar' },
  streakCount: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: Date.now },
  profileVisits: [{
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    visitedAt: { type: Date, default: Date.now }
  }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // NEW ROLE & STATUS SYSTEM
  role: { 
    type: String, 
    enum: ['user', 'moderator', 'admin', 'superadmin'], 
    default: 'user' 
  },
  status: { 
    type: String, 
    enum: ['active', 'banned', 'muted'], 
    default: 'active' 
  },
  
  // SECURITY TRACKING
  lastLoginIp: { type: String },
  deviceFingerprint: { type: String },
  loginHistory: [{
    ip: String,
    device: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// COMPOUND INDEXES FOR SEARCH
userSchema.index({ batchId: 1, fullName: 1 });
userSchema.index({ batchId: 1, username: 1 });

// Optimization Indexes
userSchema.index({ username: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ batchId: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
