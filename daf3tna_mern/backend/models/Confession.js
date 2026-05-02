import mongoose from 'mongoose';

const confessionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  // author stored for moderation ONLY — never returned to frontend
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  batchId: { type: String, required: true, index: true }
}, { timestamps: true });

export default mongoose.model('Confession', confessionSchema);
