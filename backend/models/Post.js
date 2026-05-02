import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  batchId: { type: String, required: true, index: true },
  text: { type: String },
  mediaUrls: [{ type: String }],
  mediaPublicIds: [{ type: String }], // For Cloudinary cleanup
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentsCount: { type: Number, default: 0 }
}, { timestamps: true });

// COMPOUND INDEX for feed performance
postSchema.index({ batchId: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);
