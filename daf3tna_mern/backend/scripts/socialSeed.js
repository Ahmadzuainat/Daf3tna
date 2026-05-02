import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Hub from '../models/Hub.js';
import Message from '../models/Message.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/daf3tna';

const THEMED_MESSAGES = {
  'الألعاب 🎮': [
    'مين جاهز لبطولة الفيفا اليوم؟ الحجز في صالة الألعاب الساعة 4 ⚽',
    'أنا سجلت فريقي، مين رح يتحدانا؟ 😎',
    'فالورانت يا شباب؟ ناقصنا واحد رانك دايموند 🎮',
    'أنا جاي، بس اصبروا علي 10 دقائق أحدث اللعبة',
    'شو رأيكم نلعب كول أوف ديوتي الليلة؟ 🔥'
  ],
  'البرمجة 💻': [
    'يا جماعة حدا واجه مشكلة في الـ React Router اليوم؟ 💻',
    'تأكد انك عامل Wrap للـ App بـ BrowserRouter',
    'مين بده ملخص لمادة قواعد البيانات؟ عملت واحد فخم 📚',
    'يا ريت تبعته، المادة صعبة والامتحان قرب 😢',
    'مشاريع التخرج قربت، مين بلش يكتب الـ Documentation؟'
  ],
  'الرياضة ⚽': [
    'ريال مدريد وبرشلونة الليلة! التوقعات يا شباب؟ ⚽🔥',
    'أتوقع الملكي رح يفوز 2-1، مين يراهن؟',
    'الجو بجنن اليوم، شو رأيكم ننظم مباراة كرة قدم في ملعب الجامعة؟',
    'أنا معكم، حددوا الوقت وبنحجز الملعب',
    'مين جاي جيم اليوم؟ محتاج شريك للتمرين 💪'
  ],
  'تصميم الواجهات 🎨': [
    'شو رأيكم في هذا التصميم الجديد للـ Landing Page؟ 🎨',
    'الألوان فخمة جداً، بس حاول تخفف الـ Shadow شوي',
    'Figma صاير كثير بطيء اليوم، حدا ثاني عنده نفس المشكلة؟',
    'جرب امسح الـ Cache أو استخدم نسخة الـ Desktop',
    'مين عنده مصادر لأيقونات Glassmorphism؟ ✨'
  ]
};

const POST_DATA = [
  { text: 'أجواء الدراسة في المكتبة اليوم هدوء وتركيز 📚✨', tag: 'library' },
  { text: 'وأخيراً تم تسليم مشروع التخرج! شعور لا يوصف 🎓🎉', tag: 'graduation' },
  { text: 'قهوة الصباح في ساحة الهندسة هي اللي بتعدل المزاج ☕☕', tag: 'coffee' },
  { text: 'سلفي مع الشباب قبل المحاضرة، أحلى دفعة والله 📸🔥', tag: 'friends' },
  { text: 'الجامعة بالليل عالم ثاني، سكون وجمال 🌙🌌', tag: 'campus,night' }
];

async function seedProfessionalInteractions() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB...');

    const batches = await User.distinct('batchId', { batchId: /2026/ });
    const passwordHash = await bcrypt.hash('123456', 10);

    for (const batchId of batches) {
      console.log(`\n🚀 Refining batch: ${batchId}`);

      // 1. Get/Create mock boys
      const mockUsers = await User.find({ username: new RegExp(`boy_mock_${batchId.replace(/[^a-zA-Z0-9]/g, '_')}`) });
      
      // 2. Hub-Specific Conversations
      const hubs = await Hub.find({ batchId });
      for (const hub of hubs) {
        const messages = THEMED_MESSAGES[hub.name] || THEMED_MESSAGES['البرمجة 💻'];
        const channel = hub.textChannels[0]?.name || 'الدردشة-العامة';

        // Clear old mock messages for this hub to avoid clutter
        await Message.deleteMany({ hubId: hub._id, sender: { $in: mockUsers.map(u => u._id) } });

        for (const msgText of messages) {
          const sender = mockUsers[Math.floor(Math.random() * mockUsers.length)];
          await Message.create({
            sender: sender._id,
            hubId: hub._id,
            channelName: channel,
            content: msgText,
            createdAt: new Date(Date.now() - Math.random() * 3600000) // within last hour
          });
        }
      }
      console.log(`   ✅ Themed conversations added to ${hubs.length} hubs.`);

      // 3. High-Quality Posts with Images
      // Delete some old mock posts if they exist to keep it fresh
      await Post.deleteMany({ batchId, author: { $in: mockUsers.map(u => u._id) } });

      for (let i = 0; i < POST_DATA.length; i++) {
        const author = mockUsers[i % mockUsers.length];
        await Post.create({
          author: author._id,
          batchId,
          content: POST_DATA[i].text,
          mediaUrls: [`https://source.unsplash.com/random/800x800?${POST_DATA[i].tag},university&sig=${Math.random()}`],
          likes: mockUsers.slice(0, 3).map(u => u._id),
          comments: [
            { user: mockUsers[Math.floor(Math.random() * mockUsers.length)]._id, text: 'بالتوفيق يا بطل! 🔥', createdAt: new Date() },
            { user: mockUsers[Math.floor(Math.random() * mockUsers.length)]._id, text: 'أجواء رائعة 😍', createdAt: new Date() }
          ]
        });
      }
      console.log(`   ✅ ${POST_DATA.length} high-quality posts added.`);
    }

    console.log('\n🌟 PROFESSIONAL PREVIEW READY! Refresh your app.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedProfessionalInteractions();
