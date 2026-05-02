import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const initSuperAdmin = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/daf3tna';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'admin@daf3tna.com';
    const adminPassword = 'adminPassword123!';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️ SuperAdmin already exists.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const superAdmin = new User({
      fullName: 'Daf3tna SuperAdmin',
      username: 'superadmin',
      email: adminEmail,
      passwordHash,
      university: 'Daf3tna HQ',
      major: 'System Admin',
      graduationYear: 2026,
      batchId: 'SYSTEM_ADMIN_BATCH',
      role: 'superadmin',
      status: 'active'
    });

    await superAdmin.save();
    console.log('🚀 SuperAdmin Created Successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

initSuperAdmin();
