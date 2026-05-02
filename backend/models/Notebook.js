import mongoose from 'mongoose';

const notebookSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  batchId: { type: String, required: true, index: true },
  title: { type: String, default: 'دفتر ذكرياتي' },
  description: { type: String, default: 'هذا هو دفتري لتجميع أجمل الذكريات مع دفعتي.' },
  color: { type: String, default: '#1E3A8A' },
  theme: { type: String, default: 'classic' },
  quote: { type: String, default: 'لا توجد مقولة بعد.' },
  coverImage: { type: String, default: '' },
  isPublic: { type: Boolean, default: true },
  hideAllComments: { type: Boolean, default: false },
  messages: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    isPinned: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Notebook', notebookSchema);
