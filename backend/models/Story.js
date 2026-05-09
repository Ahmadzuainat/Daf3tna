import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  batchId: { type: String, required: true, index: true },
  mediaUrl: { type: String, required: true },
  mediaPublicId: { type: String },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24*60*60*1000), 
    index: { expires: 0 } // TTL index for auto-deletion
  }
}, { timestamps: true });

// Optimization Indexes
storySchema.index({ user: 1, expiresAt: 1 });
storySchema.index({ batchId: 1, expiresAt: 1 });
storySchema.index({ expiresAt: 1 });

const Story = mongoose.model('Story', storySchema);
export default Story;
