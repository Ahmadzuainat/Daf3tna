import SiteSetting from '../models/SiteSetting.js';

/**
 * Middleware to check global site settings and feature toggles.
 * Blocks requests if site is in lockdown or feature is disabled.
 * Superadmins can bypass most locks.
 */
export const checkSystemStatus = async (req, res, next) => {
  try {
    const settings = await SiteSetting.findOne();
    if (!settings) return next();

    const isSuperAdmin = req.user && req.user.role === 'superadmin';
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');

    // 1. Maintenance / Lockdown Checks
    const isAuthRoute = req.path.startsWith('/api/auth');
    
    if (settings.maintenanceMode && !isAdmin && !isAuthRoute) {
      return res.status(503).json({ 
        message: settings.maintenanceMessage || 'الموقع في حالة صيانة حالياً. يرجى العودة لاحقاً.',
        maintenance: true 
      });
    }

    // 2. Feature-Specific Checks
    const path = req.path;
    const method = req.method;

    // Registration Lock
    if (path.includes('/auth/register') && !settings.registrationEnabled) {
      return res.status(403).json({ message: 'التسجيل معطل حالياً من قبل الإدارة.' });
    }

    // DM Lock
    if (path.includes('/chats') && !settings.dmsEnabled && !isAdmin) {
      return res.status(403).json({ message: 'المراسلات الخاصة معطلة حالياً.' });
    }

    // Hub Chat Lock
    if (path.includes('/vibes/notebooks') && path.includes('/messages') && !settings.notebooksEnabled && !isAdmin) {
      return res.status(403).json({ message: 'إضافة رسائل للدفاتر معطلة حالياً.' });
    }

    // General Uploads
    if (path.includes('/upload') && !settings.uploadsEnabled && !isAdmin) {
      return res.status(403).json({ message: 'رفع الملفات معطل حالياً.' });
    }

    next();
  } catch (error) {
    console.error('System Middleware Error:', error);
    next();
  }
};

/**
 * Granular middleware to restrict specific features based on settings.
 * Usage: router.post('/...', restrictFeature('registrationEnabled'), handler)
 */
export const restrictFeature = (featureKey) => async (req, res, next) => {
  try {
    const settings = await SiteSetting.findOne();
    if (!settings) return next();

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    
    if (!settings[featureKey] && !isAdmin) {
      return res.status(403).json({ 
        message: 'عذراً، هذه الميزة معطلة حالياً من قبل الإدارة.',
        feature: featureKey
      });
    }

    next();
  } catch (err) {
    next();
  }
};
