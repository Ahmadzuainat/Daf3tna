import mongoose from 'mongoose';

const instantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId: { type: String, required: true, index: true },
  mediaUrl: { type: String, required: true },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, required: true, index: { expires: '1m' } }
}, { timestamps: true });

export default mongoose.model('Instant', instantSchema);
