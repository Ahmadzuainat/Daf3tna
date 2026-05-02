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
  logoutEveryone
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
router.post('/broadcast-alert', adminOnly, broadcastAlert); // TASK 5

// SuperAdmin Only
router.post('/security/ban-ip', superAdminOnly, banIP);
router.get('/security/bans', superAdminOnly, getBans);
router.get('/logs', superAdminOnly, getAdminLogs);
router.post('/force-logout-all', superAdminOnly, logoutEveryone); // TASK 8

export default router;
