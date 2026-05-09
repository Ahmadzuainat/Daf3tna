import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
  channelName: { type: String },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Optimization Indexes
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
