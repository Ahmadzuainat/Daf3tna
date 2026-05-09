import express from 'express';
import { 
  getStats, 
  getUsers, 
  moderateUser, 
  getReports, 
  resolveReport, 
  getSiteSettings, 
  updateSiteSettings,
  banIP,
  getBans,
  getAdminLogs,
  getOnlineUsers,
  broadcastAlert,
  logoutEveryone,
  getAdminPosts,
  deleteAdminPost,
  getAdminStories,
  deleteAdminStory,
  deleteUser
} from '../controllers/adminController.js';
import { protect, moderatorOnly, adminOnly, superAdminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Moderator+
router.get('/reports', moderatorOnly, getReports);
router.put('/reports/:reportId', moderatorOnly, resolveReport);

// Admin+
router.get('/stats', adminOnly, getStats);
router.get('/users', adminOnly, getUsers);
router.get('/users/online', adminOnly, getOnlineUsers); // TASK 6
router.put('/users/:userId/moderate', adminOnly, moderateUser);
router.get('/settings', adminOnly, getSiteSettings);
router.put('/settings', adminOnly, updateSiteSettings);
router.post('/broadcast-alert', adminOnly, broadcastAlert);

// Content Management (Moderator+)
router.get('/content/posts', moderatorOnly, getAdminPosts);
router.delete('/content/posts/:id', moderatorOnly, deleteAdminPost);
router.get('/content/stories', moderatorOnly, getAdminStories);
router.delete('/content/stories/:id', moderatorOnly, deleteAdminStory);

// SuperAdmin Only
router.post('/security/ban-ip', superAdminOnly, banIP);
router.get('/security/bans', superAdminOnly, getBans);
router.get('/logs', superAdminOnly, getAdminLogs);
router.delete('/users/:userId', superAdminOnly, deleteUser);
router.post('/force-logout-all', adminOnly, logoutEveryone); // TASK 8

export default router;
