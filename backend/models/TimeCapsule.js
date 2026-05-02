import mongoose from 'mongoose';

const timeCapsuleSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String
  },
  unlockDate: {
    type: Date,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false // if true, everyone in batch can see it after unlock date
  }
}, { timestamps: true });

export default mongoose.model('TimeCapsule', timeCapsuleSchema);
