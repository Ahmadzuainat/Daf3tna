import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['like', 'comment', 'follow', 'follow_request', 'follow_accept', 'mention', 'hub_invite', 'profile_visit'], 
    required: true 
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  hub: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
  content: { type: String },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

// Optimization Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
