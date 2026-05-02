import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  doctor: { type: String, required: true },
  subject: { type: String, required: true },
  batchId: { type: String, required: true, index: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Quote', quoteSchema);
