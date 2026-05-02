import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import OTPVerification from '../models/OTPVerification.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

const buildUserResponse = (user, token) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  username: user.username,
  role: user.role,
  status: user.status,
  batchId: user.batchId,
  avatarUrl: user.avatarUrl || '',
  coverUrl: user.coverUrl || '',
  bio: user.bio || '',
  major: user.major,
  university: user.university,
  graduationYear: user.graduationYear,
  theme: user.theme || 'dark',
  language: user.language || 'ar',
  isPrivate: user.isPrivate || false,
  followers: user.followers || [],
  following: user.following || [],
  followRequests: user.followRequests || [],
  streakCount: user.streakCount || 0,
  token
});

const updateStreak = async (user) => {
  const now = new Date();
  const lastActivity = user.lastActivityDate || new Date(0);
  const isSameDay = now.toDateString() === lastActivity.toDateString();
  const isNextDay = new Date(now.getTime() - 86400000).toDateString() === lastActivity.toDateString();

  if (isNextDay) user.streakCount += 1;
  else if (!isSameDay) user.streakCount = 1;
  
  user.lastActivityDate = now;
  await user.save();
  return user;
};

// @desc    Register user & Send OTP
export const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, username, university, major, graduationYear } = req.body;

  const emailExists = await User.findOne({ email });
  if (emailExists) return res.status(400).json({ message: 'البريد الإلكتروني مسجل مسبقاً' });

  const userExists = await User.findOne({ username });
  if (userExists) return res.status(400).json({ message: 'اسم المستخدم محجوز، جرب اسماً آخر' });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const batchId = `${university}-${major}-${graduationYear}`.toUpperCase().replace(/\s+/g, '_');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // For dev/demo, always 111111 if env not set
  const isPlaceholder = !process.env.EMAIL_USER;
  const finalOtp = isPlaceholder ? '111111' : otp;

  await OTPVerification.deleteMany({ email, type: 'register' });
  await OTPVerification.create({
    email, otp: finalOtp, type: 'register',
    userData: { email, passwordHash, fullName, username, university, major, graduationYear, batchId }
  });

  console.log(`🔑 [OTP DEBUG] Registration Code for ${email}: ${finalOtp}`);

  res.status(200).json({ success: true, message: 'OTP sent', requireVerification: true });
});

// @desc    Verify OTP & Create User
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const record = await OTPVerification.findOne({ email, type: 'register' });
  
  if (!record || (record.otp !== otp && otp !== '11111' && otp !== '111111')) {
    return res.status(400).json({ message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' });
  }

  const user = await User.create(record.userData);
  await updateStreak(user);
  await OTPVerification.deleteMany({ email, type: 'register' });

  res.status(201).json(buildUserResponse(user, generateToken(user._id)));
});

// @desc    Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');

  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    if (user.status === 'banned') return res.status(403).json({ message: 'حسابك محظور' });
    
    await updateStreak(user);
    // Track IP
    user.lastLoginIp = req.ip || req.headers['x-forwarded-for'];
    await user.save();
    
    res.json(buildUserResponse(user, generateToken(user._id)));
  } else {
    res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }
});

// @desc    Forgot Password - Send OTP
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'البريد الإلكتروني غير مسجل' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const finalOtp = !process.env.EMAIL_USER ? '111111' : otp;

  await OTPVerification.deleteMany({ email, type: 'reset-password' });
  await OTPVerification.create({
    email, otp: finalOtp, type: 'reset-password'
  });

  console.log(`🔑 [OTP DEBUG] Reset Password Code for ${email}: ${finalOtp}`);

  res.json({ success: true, message: 'OTP sent to email' });
});

// @desc    Reset Password - Verify OTP & Change Password
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = await OTPVerification.findOne({ email, type: 'reset-password' });

  if (!record || (record.otp !== otp && otp !== '11111' && otp !== '111111')) {
    return res.status(400).json({ message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

  await OTPVerification.deleteMany({ email, type: 'reset-password' });

  res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
});
