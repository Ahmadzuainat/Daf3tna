import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Models
import User from '../models/User.js';
import Post from '../models/Post.js';
import Story from '../models/Story.js';
import Hub from '../models/Hub.js';
import HubMessage from '../models/HubMessage.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import Report from '../models/Report.js';
import AdminLog from '../models/AdminLog.js';
import BanList from '../models/BanList.js';
import OTPVerification from '../models/OTPVerification.js';
import SiteSetting from '../models/SiteSetting.js';
import Award from '../models/Award.js';
import Confession from '../models/Confession.js';
import Instant from '../models/Instant.js';
import Notebook from '../models/Notebook.js';
import Panic from '../models/Panic.js';
import Quote from '../models/Quote.js';
import TimeCapsule from '../models/TimeCapsule.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_EMAIL = 'ahmaded252a@gmail.com';

async function wipeDatabase() {
  try {
    console.log('🚀 Starting Total Database Wipe...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // 1. Clear Content Collections
    const contentModels = [
      Post, Story, Hub, HubMessage, Message, Chat, Comment, 
      Notification, Report, AdminLog, BanList, OTPVerification,
      Award, Confession, Instant, Notebook, Panic, Quote, TimeCapsule
    ];

    for (const model of contentModels) {
      const result = await model.deleteMany({});
      console.log(`   🧹 Cleared ${model.modelName}: ${result.deletedCount} items.`);
    }

    // 2. Clear Users (Except Super Admin)
    const adminUser = await User.findOne({ email: ADMIN_EMAIL });
    
    if (adminUser) {
      const result = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });
      console.log(`   👤 Cleared Users: ${result.deletedCount} items (Kept Super Admin: ${ADMIN_EMAIL}).`);
      
      // Reset Super Admin stats/fields if needed
      adminUser.followers = [];
      adminUser.following = [];
      adminUser.followRequests = [];
      adminUser.searchHistory = [];
      adminUser.profileVisits = [];
      adminUser.streakCount = 0;
      await adminUser.save();
      console.log(`   ✨ Reset Super Admin associations.`);
    } else {
      console.log(`   ⚠️ Super Admin (${ADMIN_EMAIL}) not found! No users deleted to prevent lockout.`);
    }

    // 3. Reset Site Settings
    await SiteSetting.deleteMany({});
    await SiteSetting.create({
      maintenanceMode: false,
      maintenanceMessage: 'الموقع في حالة صيانة حالياً',
      registrationEnabled: true
    });
    console.log(`   ⚙️ Reset Site Settings to default.`);

    console.log('\n🌟 TOTAL WIPE COMPLETE! The database is now fresh.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Wipe failed:', error);
    process.exit(1);
  }
}

wipeDatabase();
