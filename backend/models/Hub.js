import mongoose from 'mongoose';

const hubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  color: { type: String, default: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' },
  icon: { type: String, default: '🚀' },
  description: { type: String },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId: { type: String, required: true, index: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  textChannels: [{ name: String }],
  voiceChannels: [{ name: String }]
}, { timestamps: true });

export default mongoose.model('Hub', hubSchema);
