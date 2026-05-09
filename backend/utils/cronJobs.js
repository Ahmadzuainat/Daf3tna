import cron from 'node-cron';
import Story from '../models/Story.js';
import GameSession from '../models/GameSession.js';
import Notification from '../models/Notification.js';

/**
 * Initialize background cron jobs for maintenance and performance.
 */
export const initCronJobs = () => {
  console.log('⏰ Initializing production cron jobs...');

  // 1. Cleanup expired stories every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const result = await Story.deleteMany({ expiresAt: { $lt: now } });
      if (result.deletedCount > 0) {
        console.log(`🧹 Cron: Deleted ${result.deletedCount} expired stories.`);
      }
    } catch (err) {
      console.error('❌ Cron Cleanup Stories Error:', err);
    }
  });

  // 2. Cleanup inactive/abandoned game rooms every 6 hours
  // Delete games that are older than 24 hours and either waiting or finished
  cron.schedule('0 */6 * * *', async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await GameSession.deleteMany({
        createdAt: { $lt: oneDayAgo },
        status: { $in: ['waiting', 'finished'] }
      });
      if (result.deletedCount > 0) {
        console.log(`🧹 Cron: Cleaned up ${result.deletedCount} old game sessions.`);
      }
    } catch (err) {
      console.error('❌ Cron Cleanup Games Error:', err);
    }
  });

  // 3. Cleanup old notifications every day at midnight (older than 30 days)
  cron.schedule('0 0 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
      if (result.deletedCount > 0) {
        console.log(`🧹 Cron: Deleted ${result.deletedCount} old notifications.`);
      }
    } catch (err) {
      console.error('❌ Cron Cleanup Notifications Error:', err);
    }
  });
};

export default initCronJobs;
