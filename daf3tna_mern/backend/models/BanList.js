import mongoose from 'mongoose';

const banListSchema = new mongoose.Schema({
  type: { type: String, enum: ['ip', 'email', 'domain', 'device'], default: 'ip' },
  value: { type: String, required: true, index: true }, // The IP address or email domain
  reason: { type: String, required: true },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date }, // Null for permanent
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('BanList', banListSchema);
