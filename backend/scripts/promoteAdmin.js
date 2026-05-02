import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const promoteUser = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/daf3tna';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'ahmaded252a@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found. Please register first.');
      process.exit(1);
    }

    user.role = 'superadmin';
    await user.save();

    console.log(`🚀 User ${email} promoted to SUPERADMIN successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

promoteUser();
