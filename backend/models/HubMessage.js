import mongoose from 'mongoose';

const hubMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub', required: true, index: true },
  channelId: { type: String, required: true, index: true }, // refers to the name or unique ID of the channel in Hub
  text: { type: String },
  mediaUrl: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video', 'file', 'none'], default: 'none' },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }]
}, { timestamps: true });

// Compound index for fast retrieval of channel messages
hubMessageSchema.index({ hubId: 1, channelId: 1, createdAt: -1 });

export default mongoose.model('HubMessage', hubMessageSchema);
