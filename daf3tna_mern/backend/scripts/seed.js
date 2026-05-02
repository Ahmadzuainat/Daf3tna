import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Story from '../models/Story.js';
import Hub from '../models/Hub.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/daf3tna';

const ARABIC_NAMES = [
  'أحمد العتوم', 'سارة المجالي', 'محمد الزعبي', 'لين الفايز', 'عبدالله بني هاني',
  'رنا النسور', 'يوسف الطراونة', 'نور الحياصات', 'خالد الروسان', 'دينا البطوش',
  'زيد الخصاونة', 'سلمى عبيدات', 'فيصل الشوابكة', 'مريم القضاة', 'حمزة الضمور'
];

const MAJORS = ['هندسة البرمجيات', 'نظم المعلومات الحاسوبية', 'الأمن السيبراني', 'الذكاء الاصطناعي', 'علم الحاسوب'];

const POST_CONTENTS = [
  'ذكريات لا تنسى مع أغلى الزملاء في مختبر البرمجة! 💻✨',
  'وأخيراً خلصنا مشروع التخرج، شعور لا يوصف بعد تعب 4 سنين 🎓🎓',
  'من أجواء الكافتيريا اليوم، القعدة ما بتحلى إلا معكم ☕☕',
  'صباح الخير من ساحات الجامعة، الجو اليوم بجنن 😍🌸',
  'مساعدة يا شباب، مين عنده ملخص مادة الخوارزميات؟ 📚📚',
  'مين متحمس لبطولة الفيفا الأسبوع الجاي بالجامعة؟ 🎮🎮',
  'سلفي التخرج! الحمد لله الذي بنعمته تتم الصالحات 🎓❤️',
  'أجمل أيام العمر هي اللي بنقضيها بالجامعة، استغلوا كل لحظة 🌟✨'
];

const IMAGE_CATEGORIES = ['university', 'graduation', 'coffee', 'laptop', 'nature', 'friends'];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // Get ALL unique batches from existing users
    const batches = await User.distinct('batchId');
    console.log(`🌱 Found ${batches.length} unique batches:`, batches);

    if (batches.length === 0) {
       console.log('❌ No batches found. Please create at least one user first.');
       process.exit(0);
    }

    const passwordHash = await bcrypt.hash('123456', 10);

    for (const batchId of batches) {
      if (!batchId) continue;
      console.log(`\n📦 Seeding data for batch: ${batchId}`);

      // 1. Create Users for this batch
      const batchUsers = [];
      for (let i = 0; i < 5; i++) {
        const fullName = getRandom(ARABIC_NAMES) + ' (وهمي)';
        const username = `mock_${batchId.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`;
        
        const user = await User.findOneAndUpdate(
          { username },
          {
            fullName,
            username,
            email: `${username}@mock.com`,
            passwordHash,
            university: batchId.split('-')[0] || 'جامعة آل البيت',
            major: getRandom(MAJORS),
            batchId,
            avatarUrl: `https://i.pravatar.cc/150?u=${username}`,
            coverUrl: `https://source.unsplash.com/random/800x400?university,${i}`,
            bio: 'حساب تجريبي لعرض مميزات المنصة 🚀'
          },
          { upsert: true, new: true }
        );
        batchUsers.push(user);
      }
      console.log(`   ✅ Created ${batchUsers.length} users`);

      // 2. Create Stories
      for (let i = 0; i < 5; i++) {
        await Story.create({
          user: getRandom(batchUsers)._id,
          imageUrl: `https://source.unsplash.com/random/400x700?portrait,${i}`,
          batchId
        });
      }
      console.log('   ✅ Created stories');

      // 3. Create Posts
      for (let i = 0; i < 10; i++) {
        const author = getRandom(batchUsers);
        const likes = batchUsers.slice(0, Math.floor(Math.random() * batchUsers.length)).map(u => u._id);
        
        await Post.create({
          author: author._id,
          batchId,
          content: getRandom(POST_CONTENTS),
          mediaUrls: [`https://source.unsplash.com/random/600x600?${getRandom(IMAGE_CATEGORIES)},${i}`],
          likes,
          comments: [
            {
              user: getRandom(batchUsers)._id,
              text: 'روعة! 🔥',
              createdAt: new Date()
            },
            {
              user: getRandom(batchUsers)._id,
              text: 'بالتوفيق يا شباب 🚀',
              createdAt: new Date()
            }
          ]
        });
      }
      console.log('   ✅ Created posts');
    }

    console.log('\n🚀 SEEDING COMPLETE FOR ALL BATCHES! Refresh your app.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
