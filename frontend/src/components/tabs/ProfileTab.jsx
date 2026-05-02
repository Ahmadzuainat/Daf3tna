import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { motion } from 'framer-motion';
import { Camera, Edit3, Settings, Grid, Bookmark, User as UserIcon, LogOut, ChevronLeft, Save, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import CreatePostModal from '../common/CreatePostModal';

const ProfileTab = ({ user: profileUser, isOwnProfile, onSettingsClick, setSelectedPost }) => {
  const { user, updateUser } = useAuthStore();
  const { updateProfile, fetchUserPosts } = useAppStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchedUser, setFetchedUser] = useState(null);
  const [followStatus, setFollowStatus] = useState('none'); // 'none', 'following', 'requested'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { fetchUserProfile, followUser, fetchPostDetails } = useAppStore();
  
  const [editData, setEditData] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
  });

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const loadProfile = React.useCallback(async () => {
    if (profileUser?._id && !isOwnProfile) {
      try {
        const data = await fetchUserProfile(profileUser.username || profileUser._id);
        setFetchedUser(data);
        
        // Determine initial follow status
        if (user?.following?.includes(data._id)) {
          setFollowStatus('following');
        } else if (data.followRequests?.includes(user?._id)) {
          setFollowStatus('requested');
        } else {
          setFollowStatus('none');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    }
  }, [profileUser, isOwnProfile, user, fetchUserProfile]);

  React.useEffect(() => {
    if (profileUser?._id) {
      setLoading(true);
      fetchUserPosts(profileUser._id).then(data => {
        setPosts(data);
        setLoading(false);
      }).catch(() => setLoading(false));

      if (!isOwnProfile) {
        loadProfile();
      }
    }
  }, [profileUser?._id, isOwnProfile, fetchUserPosts, loadProfile]);

  const handleImageChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file); // 'avatar' or 'cover'

    setSaving(true);
    try {
      const res = await updateProfile(formData);
      if (res.success) {
        updateUser(res.data);
        toast.success(type === 'avatar' ? 'تم تحديث الصورة الشخصية' : 'تم تحديث غلاف الملف');
      }
    } catch (err) {
      toast.error('فشل تحديث الصورة');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const res = await updateProfile(editData);
      if (res.success) {
        updateUser(res.data);
        setIsEditing(false);
        toast.success('تم تحديث البيانات');
      }
    } catch (err) {
      toast.error('فشل التحديث');
    } finally {
      setSaving(false);
    }
  };

  const handleFollowToggle = async () => {
    setSaving(true);
    try {
      const res = await followUser(profileUser._id);
      setFollowStatus(res.status);
      toast.success(res.message);
      
      // Update local follower count and auth store
      if (res.status === 'following') {
         updateUser({ ...user, following: [...user.following, profileUser._id] });
      } else if (res.status === 'none') {
         updateUser({ ...user, following: user.following.filter(id => id !== profileUser._id) });
      }
      
      // Re-fetch profile to get updated counts
      loadProfile();
    } catch (err) {
      toast.error('فشل العملية');
    } finally {
      setSaving(false);
    }
  };

  const handlePostClick = async (post) => {
    try {
      const details = await fetchPostDetails(post._id);
      setSelectedPost(details);
    } catch (err) {
      setSelectedPost(post);
      toast.error('فشل تحميل تفاصيل المنشور');
    }
  };

  const displayUser = isOwnProfile ? user : (fetchedUser || profileUser);

  return (
    <div className="fade-in" style={{ paddingBottom: '100px', background: 'var(--bg-dark)', minHeight: '100vh' }}>
      {/* Cover Image */}
      <div style={{ position: 'relative', height: '220px', background: 'var(--surface-dark)', overflow: 'hidden' }}>
        <img 
          src={displayUser?.coverUrl || "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=800"} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        {isOwnProfile && (
          <div 
            onClick={() => coverInputRef.current.click()}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderRadius: '50%', padding: '10px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', zIndex: 10 }}
          >
            <Camera size={20} color="white" />
          </div>
        )}
        <input type="file" ref={coverInputRef} style={{ display: 'none' }} onChange={(e) => handleImageChange(e, 'cover')} accept="image/*" />
      </div>

      {/* Profile Info */}
      <div style={{ padding: '0 20px', marginTop: '-60px', position: 'relative', zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--bg-dark)', overflow: 'hidden', background: '#222' }}>
              <img src={displayUser?.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {isOwnProfile && (
              <div 
                onClick={() => avatarInputRef.current.click()}
                style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary-blue)', borderRadius: '50%', padding: '8px', border: '3px solid var(--bg-dark)', cursor: 'pointer' }}
              >
                <Camera size={16} color="white" />
              </div>
            )}
            <input type="file" ref={avatarInputRef} style={{ display: 'none' }} onChange={(e) => handleImageChange(e, 'avatar')} accept="image/*" />
          </div>

          <div style={{ display: 'flex', gap: '8px', paddingBottom: '10px' }}>
            {isOwnProfile ? (
              <>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  style={{ background: 'var(--primary-blue)', border: 'none', color: 'white', padding: '8px 20px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <PlusCircle size={18} />
                  منشور جديد
                </button>
                <button 
                  onClick={() => isEditing ? handleSaveInfo() : setIsEditing(true)}
                  disabled={saving}
                  style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 20px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isEditing ? <Save size={18} /> : <Edit3 size={18} />}
                  {isEditing ? 'حفظ' : 'تعديل'}
                </button>
                <button onClick={onSettingsClick} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px', borderRadius: '12px' }}>
                  <Settings size={20} />
                </button>
              </>
            ) : (
              <button 
                onClick={handleFollowToggle}
                disabled={saving}
                style={{ 
                  background: followStatus === 'following' ? 'rgba(255,255,255,0.1)' : 'var(--primary-blue)', 
                  color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 'bold',
                  border: followStatus === 'following' ? '1px solid rgba(255,255,255,0.2)' : 'none'
                }}
              >
                {followStatus === 'following' ? 'إلغاء المتابعة' : followStatus === 'requested' ? 'تم طلب المتابعة' : 'متابعة'}
              </button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          {isEditing ? (
            <input 
              style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', width: '100%', marginBottom: '8px', fontSize: '1.4rem', fontWeight: 'bold', outline: 'none' }} 
              value={editData.fullName}
              onChange={e => setEditData({...editData, fullName: e.target.value})}
            />
          ) : (
            <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{displayUser?.fullName}</h2>
          )}
          <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>@{displayUser?.username}</p>
          
          {isEditing ? (
            <textarea 
              style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', width: '100%', minHeight: '80px', outline: 'none' }}
              value={editData.bio}
              onChange={e => setEditData({...editData, bio: e.target.value})}
              placeholder="اكتب نبذة عنك..."
            />
          ) : (
            <p style={{ color: 'var(--text-primary)', opacity: 0.8, lineHeight: '1.5', maxWidth: '500px' }}>{displayUser?.bio || 'لا توجد نبذة تعريفية.'}</p>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '32px', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{posts.length}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>منشور</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{displayUser?.followers?.length || 0}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>متابع</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{displayUser?.following?.length || 0}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>يتابع</span>
          </div>
        </div>

        {/* Posts Grid */}
        {(!isOwnProfile && displayUser?.isPrivate && followStatus !== 'following') ? (
           <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <UserIcon size={48} color="var(--text-secondary)" style={{ marginBottom: '16px', opacity: 0.3 }} />
              <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>هذا الحساب خاص</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>تابع هذا المستخدم لرؤية منشوراته وقصصه</p>
           </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            {posts.length > 0 ? posts.map(post => (
              <div 
                key={post._id} 
                onClick={() => handlePostClick(post)}
                style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
              >
                <img src={post.mediaUrls?.[0] || "https://via.placeholder.com/150"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )) : (
              <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                لا يوجد منشورات حتى الآن
              </div>
            )}
          </div>
        )}

        <CreatePostModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          onPostCreated={() => fetchUserPosts(displayUser._id).then(setPosts)}
        />
      </div>
    </div>
  );
};

export default ProfileTab;
