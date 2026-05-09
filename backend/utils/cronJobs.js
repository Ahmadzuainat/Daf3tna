import cron from 'node-cron';
import Story from '../models/Story.js';
import GameSession from '../models/GameSession.js';
import Notification from '../models/Notification.js';

const setupCronJobs = () => {
  // 1. Cleanup expired stories every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const result = await Story.deleteMany({ expiresAt: { $lt: now } });
      console.log(`🧹 Cron: Deleted ${result.deletedCount} expired stories`);
    } catch (error) {
      console.error('❌ Cron Error (Stories):', error);
    }
  });

  // 2. Cleanup inactive game rooms every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const result = await GameSession.deleteMany({ 
        status: 'waiting', 
        createdAt: { $lt: sixHoursAgo } 
      });
      console.log(`🧹 Cron: Deleted ${result.deletedCount} inactive game rooms`);
    } catch (error) {
      console.error('❌ Cron Error (Games):', error);
    }
  });

  // 3. Cleanup old notifications (older than 30 days) every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
      console.log('🧹 Cron: Cleaned up old notifications');
    } catch (error) {
      console.error('❌ Cron Error (Notifications):', error);
    }
  });
};

export default setupCronJobs;
