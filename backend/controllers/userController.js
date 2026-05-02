import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/uploadMiddleware.js';
import Notification from '../models/Notification.js';

// @desc    Update User Profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

  const { fullName, bio, theme, language, isPrivate } = req.body;

  if (fullName) user.fullName = fullName;
  if (bio) user.bio = bio;
  if (theme) user.theme = theme;
  if (language) user.language = language;
  if (isPrivate !== undefined) user.isPrivate = isPrivate;

  // Handle Avatar Upload
  if (req.files?.avatar) {
    // Delete old avatar if it exists and is on Cloudinary
    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    }
    const result = await uploadToCloudinary(req.files.avatar[0].buffer, 'avatars');
    user.avatarUrl = result.secure_url;
    user.avatarPublicId = result.public_id;
  }

  // Handle Cover Upload
  if (req.files?.cover) {
    if (user.coverPublicId) {
      await deleteFromCloudinary(user.coverPublicId);
    }
    const result = await uploadToCloudinary(req.files.cover[0].buffer, 'covers');
    user.coverUrl = result.secure_url;
    user.coverPublicId = result.public_id;
  }

  await user.save();
  res.json({ success: true, data: user });
});

// @desc    Get User Profile by Username
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .select('-passwordHash')
    .lean(); // Performance: returns plain JS object
  
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
  res.json(user);
});
// @desc    Toggle Follow (Follow/Unfollow/Request)
export const toggleFollow = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user._id;

  if (targetId === userId.toString()) {
    return res.status(400).json({ message: 'لا يمكنك متابعة نفسك' });
  }

  const targetUser = await User.findById(targetId);
  const currentUser = await User.findById(userId);

  if (!targetUser) return res.status(404).json({ message: 'المستخدم غير موجود' });

  const isFollowing = currentUser.following.includes(targetId);
  const hasRequested = targetUser.followRequests.includes(userId);

  if (isFollowing) {
    // Unfollow
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId.toString());
    await currentUser.save();
    await targetUser.save();
    return res.json({ success: true, status: 'none', message: 'تم إلغاء المتابعة' });
  }

  if (hasRequested) {
    // Cancel Request
    targetUser.followRequests = targetUser.followRequests.filter(id => id.toString() !== userId.toString());
    await targetUser.save();
    return res.json({ success: true, status: 'none', message: 'تم إلغاء طلب المتابعة' });
  }

  // Follow Logic
  if (targetUser.isPrivate) {
    // Private Account -> Send Request
    targetUser.followRequests.push(userId);
    await targetUser.save();
    
    // Notify
    await Notification.create({
      recipient: targetId,
      sender: userId,
      type: 'follow_request'
    });

    return res.json({ success: true, status: 'requested', message: 'تم إرسال طلب متابعة' });
  } else {
    // Public Account -> Follow Instantly
    currentUser.following.push(targetId);
    targetUser.followers.push(userId);
    await currentUser.save();
    await targetUser.save();

    // Notify
    await Notification.create({
      recipient: targetId,
      sender: userId,
      type: 'follow'
    });

    return res.json({ success: true, status: 'following', message: 'تمت المتابعة' });
  }
});

// @desc    Accept Follow Request
export const acceptFollowRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;
  const userId = req.user._id;

  const user = await User.findById(userId);
  const requester = await User.findById(requesterId);

  if (!user.followRequests.includes(requesterId)) {
    return res.status(400).json({ message: 'طلب المتابعة غير موجود' });
  }

  // Move from requests to followers
  user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId);
  user.followers.push(requesterId);
  requester.following.push(userId);

  await user.save();
  await requester.save();

  // Notify
  await Notification.create({
    recipient: requesterId,
    sender: userId,
    type: 'follow_accept'
  });

  // Mark request notification as read
  await Notification.updateMany(
    { recipient: userId, sender: requesterId, type: 'follow_request' },
    { isRead: true }
  );

  res.json({ success: true, message: 'تم قبول الطلب' });
});

// @desc    Reject Follow Request
export const rejectFollowRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;
  const userId = req.user._id;

  const user = await User.findById(userId);
  user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId);
  await user.save();

  res.json({ success: true, message: 'تم رفض الطلب' });
});
