import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { 
    type: String, 
    enum: ['User', 'Post', 'Comment', 'Story', 'Message', 'Confession', 'Hub', 'GraduationBook'],
    required: true 
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { 
    type: String, 
    enum: ['spam', 'harassment', 'fake content', 'abuse', 'scam', 'inappropriate', 'other'],
    required: true 
  },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'priority', 'resolved', 'dismissed'], 
    default: 'pending' 
  },
  resolutionNote: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
