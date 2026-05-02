import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from './asyncHandler.js';

// 1. Protect routes (require login)
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'غير مصرح لك، يرجى تسجيل الدخول' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({ message: 'المستخدم غير موجود' });
    }

    // ENSURE ROOT EMAIL GETS SUPERADMIN AUTOMATICALLY
    if (user.email === 'ahmaded252a@gmail.com' && user.role !== 'superadmin') {
      user.role = 'superadmin';
      await user.save();
    }

    if (user.status === 'banned') {
      return res.status(403).json({ message: 'حسابك محظور من دخول المنصة' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' });
  }
});

// 2. Moderator+ check
export const moderatorOnly = (req, res, next) => {
  if (req.user && ['moderator', 'admin', 'superadmin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'هذا الإجراء مخصص للمشرفين فقط' });
  }
};

// 3. Admin+ check
export const adminOnly = (req, res, next) => {
  if (req.user && ['admin', 'superadmin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'هذا الإجراء مخصص للإدارة فقط' });
  }
};

// 4. SuperAdmin check
export const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: 'هذا الإجراء مخصص للمدير العام فقط' });
  }
};
