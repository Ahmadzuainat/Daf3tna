import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
  channelName: { type: String },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
