import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Story from '../models/Story.js';
import Hub from '../models/Hub.js';
import Report from '../models/Report.js';
import AdminLog from '../models/AdminLog.js';
import SiteSetting from '../models/SiteSetting.js';
import BanList from '../models/BanList.js';

// --- PHASE 4: OVERVIEW ---
export const getStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeToday = await User.countDocuments({ lastSeen: { $gte: new Date(Date.now() - 24*60*60*1000) } });
  const totalPosts = await Post.countDocuments();
  const pendingReports = await Report.countDocuments({ status: 'pending' });
  const bannedUsers = await User.countDocuments({ status: 'banned' });

  // Simple growth chart data (last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0,0,0,0);
    return d;
  }).reverse();

  const userGrowth = await Promise.all(last7Days.map(async (date) => {
    const count = await User.countDocuments({ createdAt: { $lte: new Date(date.getTime() + 24*60*60*1000) } });
    return { date: date.toISOString().split('T')[0], count };
  }));

  res.json({
    success: true,
    data: { totalUsers, activeToday, totalPosts, pendingReports, bannedUsers, userGrowth }
  });
});

// --- PHASE 5: USERS MANAGEMENT ---
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', sort = '-createdAt' } = req.query;
  const query = search ? {
    $or: [
      { fullName: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  } : {};

  const users = await User.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await User.countDocuments(query);

  res.json({ success: true, data: users, total, pages: Math.ceil(total / limit) });
});

export const moderateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, role, reason } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

  // Safety: Admin cannot demote Superadmin
  if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'لا يمكن تعديل صلاحيات المدير العام' });
  }

  if (status) user.status = status;
  if (role) user.role = role;
  await user.save();

  await AdminLog.create({
    admin: req.user._id,
    action: 'MODERATE_USER',
    targetType: 'User',
    targetId: user._id,
    details: { status, role, reason },
    ipAddress: req.ip
  });

  res.json({ success: true, data: user });
});

// --- PHASE 7: REPORT SYSTEM ---
export const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find()
    .populate('reporter', 'fullName username')
    .sort('-createdAt');
  res.json({ success: true, data: reports });
});

export const resolveReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { status, note } = req.body;

  const report = await Report.findById(reportId);
  if (!report) return res.status(404).json({ message: 'البلاغ غير موجود' });

  report.status = status;
  report.resolutionNote = note;
  report.resolvedBy = req.user._id;
  report.resolvedAt = Date.now();
  await report.save();

  res.json({ success: true, data: report });
});

// --- PHASE 12: SITE CONTROL ---
export const getSiteSettings = asyncHandler(async (req, res) => {
  let settings = await SiteSetting.findOne();
  if (!settings) settings = await SiteSetting.create({});
  res.json({ success: true, data: settings });
});

export const updateSiteSettings = asyncHandler(async (req, res) => {
  let settings = await SiteSetting.findOne();
  if (!settings) settings = new SiteSetting();

  Object.assign(settings, req.body);
  settings.updatedBy = req.user._id;
  await settings.save();

  await AdminLog.create({
    admin: req.user._id,
    action: 'UPDATE_SETTINGS',
    targetType: 'SiteSetting',
    details: req.body,
    ipAddress: req.ip
  });

  res.json({ success: true, data: settings });
});

// --- PHASE 13: SECURITY (IP BANS) ---
export const banIP = asyncHandler(async (req, res) => {
  const { ip, reason, expiresAt } = req.body;
  const ban = await BanList.create({
    value: ip,
    reason,
    expiresAt,
    bannedBy: req.user._id
  });
  res.json({ success: true, data: ban });
});

export const getBans = asyncHandler(async (req, res) => {
  const bans = await BanList.find().populate('bannedBy', 'fullName');
  res.json({ success: true, data: bans });
});

// --- PHASE 15: AUDIT LOGS ---
export const getAdminLogs = asyncHandler(async (req, res) => {
  const logs = await AdminLog.find()
    .populate('admin', 'fullName username')
    .sort('-createdAt')
    .limit(100);
  res.json({ success: true, data: logs });
});
