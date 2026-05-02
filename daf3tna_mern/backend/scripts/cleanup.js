import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Story from '../models/Story.js';
import Hub from '../models/Hub.js';
import Message from '../models/Message.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/daf3tna';

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for cleanup...');

    // 1. Find all mock users
    const mockUserIds = (await User.find({ 
      $or: [
        { username: /^mock_/ },
        { username: /^boy_mock_/ },
        { username: /^user_\d/ },
        { email: /@mock\.com$/ },
        { fullName: /وهمي/ }
      ]
    })).map(u => u._id);

    console.log(`🧹 Found ${mockUserIds.length} mock users to delete.`);

    if (mockUserIds.length > 0) {
      // 2. Delete posts by mock users
      const deletedPosts = await Post.deleteMany({ author: { $in: mockUserIds } });
      console.log(`   ✅ Deleted ${deletedPosts.deletedCount} posts.`);

      // 3. Delete stories by mock users
      const deletedStories = await Story.deleteMany({ user: { $in: mockUserIds } });
      console.log(`   ✅ Deleted ${deletedStories.deletedCount} stories.`);

      // 4. Delete messages by mock users
      const deletedMessages = await Message.deleteMany({ sender: { $in: mockUserIds } });
      console.log(`   ✅ Deleted ${deletedMessages.deletedCount} messages.`);

      // 5. Remove mock users from Hub members
      await Hub.updateMany(
        {},
        { $pull: { members: { $in: mockUserIds } } }
      );
      console.log('   ✅ Removed mock users from all Hubs.');

      // 6. Finally, delete the users
      const deletedUsers = await User.deleteMany({ _id: { $in: mockUserIds } });
      console.log(`   ✅ Deleted ${deletedUsers.deletedCount} mock users.`);
    }

    console.log('\n✨ CLEANUP COMPLETE! Your database is now clean.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
