import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Post from './models/Post.js';
import Hub from './models/Hub.js';
import Chat from './models/Chat.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://daf3tnatest:daf3tnatest@daf3tnatest.g56gsjf.mongodb.net/?appName=daf3tnatest';

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    // Create a mock user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const user1 = new User({
      fullName: 'أحمد محمود',
      email: 'ahmad@test.com',
      passwordHash,
      university: 'الجامعة الأردنية',
      major: 'Computer Science',
      graduationYear: 2026,
      batchId: 'الجامعة الأردنية-Computer Science-2026',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
    });
    
    const user2 = new User({
      fullName: 'خالد عبد الله',
      email: 'khaled@test.com',
      passwordHash,
      university: 'الجامعة الأردنية',
      major: 'Computer Science',
      graduationYear: 2026,
      batchId: 'الجامعة الأردنية-Computer Science-2026',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop'
    });

    await User.deleteMany({ email: { $in: ['ahmad@test.com', 'khaled@test.com'] } });
    const savedUser1 = await user1.save();
    const savedUser2 = await user2.save();
    console.log('Users created');

    const post1 = new Post({
      author: savedUser1._id,
      batchId: savedUser1.batchId,
      content: 'أخيراً خلصت مشروع التخرج! 💻🔥',
      mediaUrls: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500'],
      likes: [savedUser2._id]
    });

    await Post.deleteMany({ content: 'أخيراً خلصت مشروع التخرج! 💻🔥' });
    await post1.save();
    console.log('Post created');

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
