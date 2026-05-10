import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'BAN_USER', 'DELETE_POST', 'CHANGE_SETTING'
  targetType: { type: String }, // 'User', 'Post', 'SiteSetting', etc. (Optional)
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

export default mongoose.model('AdminLog', adminLogSchema);
