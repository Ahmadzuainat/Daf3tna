import mongoose from 'mongoose';

const siteSettingSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  maintenanceType: { 
    type: String, 
    enum: ['soft', 'read-only', 'lockdown', 'emergency'], 
    default: 'soft' 
  },
  maintenanceMessage: { type: String, default: 'الموقع في حالة صيانة حالياً' },
  
  // GRANULAR FEATURE TOGGLES
  registrationEnabled: { type: Boolean, default: true },
  dmsEnabled: { type: Boolean, default: true },
  hubChatEnabled: { type: Boolean, default: true },
  storiesEnabled: { type: Boolean, default: true },
  uploadsEnabled: { type: Boolean, default: true },
  commentsEnabled: { type: Boolean, default: true },
  notebooksEnabled: { type: Boolean, default: true },
  
  announcement: {
    text: { type: String, default: '' },
    isActive: { type: Boolean, default: false },
    type: { type: String, enum: ['info', 'warning', 'emergency'], default: 'info' }
  },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('SiteSetting', siteSettingSchema);
