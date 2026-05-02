import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      console.log(`Processing collection: ${collection.collectionName}`);
      
      // Update all documents where a string field contains localhost:5000
      // We'll look for specific fields like avatarUrl, coverUrl, mediaUrls, imageUrl, etc.
      
      const cursor = collection.find({});
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        let updated = false;
        
        const updateDoc = (obj) => {
          for (const key in obj) {
            if (typeof obj[key] === 'string' && obj[key].includes('localhost:5000')) {
              obj[key] = obj[key].replace(/localhost:5000/g, 'localhost:5001');
              updated = true;
            } else if (Array.isArray(obj[key])) {
              obj[key] = obj[key].map(item => {
                if (typeof item === 'string' && item.includes('localhost:5000')) {
                  updated = true;
                  return item.replace(/localhost:5000/g, 'localhost:5001');
                }
                return item;
              });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              updateDoc(obj[key]);
            }
          }
        };
        
        updateDoc(doc);
        
        if (updated) {
          await collection.replaceOne({ _id: doc._id }, doc);
          console.log(`Updated document ${doc._id} in ${collection.collectionName}`);
        }
      }
    }

    console.log('✅ Migration completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
