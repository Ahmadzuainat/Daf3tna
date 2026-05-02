import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const MONGO_URI = process.env.MONGO_URI;

// Define Hub Schema locally for seeding
const hubSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  color: String,
  icon: String,
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  batchId: String,
  textChannels: [{ name: String }],
  voiceChannels: [{ name: String }],
}, { timestamps: true });

const Hub = mongoose.model('Hub', hubSchema);

const DEFAULT_HUBS = [
  { 
    name: 'الألعاب 🎮', category: 'تسلية', color: 'linear-gradient(135deg, #EF4444, #F97316)', icon: '🎮',
    description: 'تجمع لاعبي الجامعة! تنظيم بطولات أسبوعية في فيفا، فالورانت، وليق أوف ليجيندز.',
    textChannels: [{ name: 'الدردشة-العامة' }, { name: 'تحديات-فيفا' }, { name: 'فالورانت' }],
    voiceChannels: [{ name: 'صالة الاستراحة' }, { name: 'بطولة فيفا (لايف)' }]
  },
  { 
    name: 'البرمجة 💻', category: 'دراسة', color: 'linear-gradient(135deg, #F59E0B, #FCD34D)', icon: '💻',
    description: 'مساعدة في الواجبات، مشاريع التخرج، ومناقشة أحدث التقنيات البرمجية ومسابقات الـ Hackathon.',
    textChannels: [{ name: 'الدردشة-العامة' }, { name: 'مساعدة-بالكود' }, { name: 'مشاريع-التخرج' }],
    voiceChannels: [{ name: 'غرفة الدراسة' }, { name: 'ورشة عمل' }]
  },
  { 
    name: 'الرياضة ⚽', category: 'نشاطات', color: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', icon: '⚽',
    description: 'نقاشات عن مباريات دوري الأبطال، وتنظيم مباريات كرة قدم أسبوعية لطلاب الجامعة.',
    textChannels: [{ name: 'الدردشة-العامة' }, { name: 'حجز-الملاعب' }, { name: 'توقعات-المباريات' }],
    voiceChannels: [{ name: 'مقهى المباريات' }]
  },
  { 
    name: 'تصميم الواجهات 🎨', category: 'فنون', color: 'linear-gradient(135deg, #EC4899, #F43F5E)', icon: '🎨',
    description: 'مشاركة تصاميم UI/UX وتبادل التغذية الراجعة وتجارب استخدام Figma.',
    textChannels: [{ name: 'الدردشة-العامة' }, { name: 'تقييم-التصاميم' }, { name: 'تحديات-Figma' }],
    voiceChannels: [{ name: 'ورشة التصميم' }]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all unique batchIds from users
    const User = mongoose.model('User', new mongoose.Schema({ batchId: String }));
    const batches = await User.distinct('batchId');
    
    // Also include the one from the screenshot just in case
    if (!batches.includes('TEST UNIVERSITY - COMPUTER SCIENCE')) {
      batches.push('TEST UNIVERSITY - COMPUTER SCIENCE');
    }

    for (const batchId of batches) {
      if (!batchId) continue;
      
      const count = await Hub.countDocuments({ batchId });
      if (count === 0) {
        console.log(`🌱 Seeding hubs for batch: ${batchId}`);
        const hubsToInsert = DEFAULT_HUBS.map(hub => ({
          ...hub,
          batchId,
          members: [] // Initially empty
        }));
        await Hub.insertMany(hubsToInsert);
      } else {
        console.log(`✔ Batch ${batchId} already has ${count} hubs.`);
      }
    }

    console.log('✅ Seeding completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
