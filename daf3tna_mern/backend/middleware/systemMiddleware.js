import SiteSetting from '../models/SiteSetting.js';
import BanList from '../models/BanList.js';
import asyncHandler from './asyncHandler.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const checkSystemStatus = asyncHandler(async (req, res, next) => {
  // 1. IP Ban Check
  const clientIp = req.ip || req.headers['x-forwarded-for'];
  const isBanned = await BanList.findOne({ value: clientIp, type: 'ip', isActive: true });
  if (isBanned) {
    return res.status(403).json({ 
      message: 'تم حظر عنوان IP الخاص بك من دخول المنصة',
      reason: isBanned.reason 
    });
  }

  // 2. Fetch Site Settings (Cached or fresh)
  const settings = await SiteSetting.findOne();
  if (!settings) return next();

  req.siteSettings = settings;

  // 3. Maintenance Mode Check
  let isStaff = false;
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id).select('role');
      if (user && ['moderator', 'admin', 'superadmin'].includes(user.role)) {
        isStaff = true;
      }
    } catch (err) { /* ignore invalid token for this check */ }
  }

  // If maintenance is on and user is not staff, block based on type
  if (settings.maintenanceMode && !isStaff) {
    if (settings.maintenanceType === 'emergency' || settings.maintenanceType === 'lockdown') {
      return res.status(503).json({ 
        success: false,
        message: settings.maintenanceMessage || 'الموقع تحت الصيانة حالياً',
        type: settings.maintenanceType
      });
    }
  }

  next();
});

export const restrictFeature = (feature) => (req, res, next) => {
  const settings = req.siteSettings;
  if (!settings) return next();

  const isRestricted = (feature === 'registration' && !settings.registrationEnabled) ||
                      (feature === 'messages' && !settings.messagesEnabled) ||
                      (feature === 'uploads' && !settings.uploadsEnabled) ||
                      (feature === 'stories' && !settings.storiesEnabled);

  if (isRestricted && (!req.user || !['admin', 'superadmin'].includes(req.user.role))) {
    return res.status(403).json({ 
      message: `عذراً، ميزة ${feature} معطلة مؤقتاً من قبل الإدارة`
    });
  }

  next();
};
