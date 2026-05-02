import mongoose from 'mongoose';

const awardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId: { type: String, required: true, index: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  duration: { type: String, default: '24h' }
}, { timestamps: true });

export default mongoose.model('Award', awardSchema);
