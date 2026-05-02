import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, Trash2, Heart, MessageCircle, Repeat, Send } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';

const PostDetailModal = ({ post, onClose }) => {
  const { user } = useAuthStore();
  const { deletePost, updatePost, likePost, commentPost, fetchPostDetails } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post?.text || '');
  const [commentText, setCommentText] = useState('');
  const [localPost, setLocalPost] = useState(post);

  useEffect(() => {
    if (post?._id) {
      setLocalPost(post);
      setEditText(post.text || '');
      setIsEditing(false);
    }
  }, [post]);

  if (!post) return null;

  const getImageUrl = (url) => {
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) return "https://via.placeholder.com/150";
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'https://daf3tna.onrender.com';
    const cleanBase = baseUrl.endsWith('/api') ? baseUrl.replace('/api', '') : baseUrl;
    return `${cleanBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنشور؟')) return;
    try {
      await deletePost(localPost._id);
      onClose();
      toast.success('تم حذف المنشور');
    } catch (err) {
      toast.error('فشل حذف المنشور');
    }
  };

  const handleUpdate = async () => {
    if (!editText.trim()) return toast.error('النص لا يمكن أن يكون فارغاً');
    try {
      const updated = await updatePost(localPost._id, editText);
      setLocalPost(prev => ({ ...prev, text: updated.text }));
      setIsEditing(false);
      toast.success('تم تحديث المنشور');
    } catch (err) {
      toast.error('فشل تحديث المنشور');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const newComment = await commentPost(localPost._id, commentText);
      setLocalPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
        commentsCount: (prev.commentsCount || 0) + 1
      }));
      setCommentText('');
    } catch (err) {
      toast.error('فشل إضافة التعليق');
    }
  };

  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'moderator';
  const postUserId = localPost.user?._id || localPost.user;
  const isOwner = user?._id && postUserId && postUserId.toString() === user._id.toString();

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{ 
        position: 'fixed', inset: 0, 
        background: 'rgba(0,0,0,0.85)', 
        backdropFilter: 'blur(10px)', 
        zIndex: 2000, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: '20px'
      }}
    >
      <motion.div 
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          maxHeight: '85vh', 
          background: 'var(--bg-dark)', 
          borderRadius: '32px', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          border: '1px solid rgba(255,255,255,0.1)', 
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <div 
          onClick={onClose}
          style={{ 
            position: 'absolute', top: '12px', left: '12px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '50%', padding: '6px', 
            cursor: 'pointer', zIndex: 10
          }}
        >
          <X size={16} color="white" />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }} className="hide-scrollbar">
          <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={getImageUrl(localPost.user?.avatarUrl)} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--primary-blue)', objectFit: 'cover' }} />
              <div>
                <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'white' }}>{localPost.user?.fullName || 'User'}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(localPost.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>

            {(isOwner || isAdmin) && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {isOwner && (
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    style={{ background: isEditing ? '#F59E0B' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px' }}
                  >
                    <Edit size={18} color={isEditing ? 'black' : '#F59E0B'} />
                  </button>
                )}
                <button 
                  onClick={handleDelete}
                  style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', padding: '6px' }}
                >
                  <Trash2 size={18} color="#F59E0B" />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <textarea 
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', padding: '12px', minHeight: '100px', marginBottom: '12px', outline: 'none' }}
              />
              <button 
                onClick={handleUpdate}
                style={{ background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '10px', fontWeight: 'bold' }}
              >
                حفظ التعديلات
              </button>
            </div>
          ) : (
            localPost.text && <p style={{ padding: '0 16px', fontSize: '1.1rem', lineHeight: '1.5', marginBottom: '16px', color: 'white' }}>{localPost.text}</p>
          )}

          {localPost.mediaUrls?.[0] && <img src={getImageUrl(localPost.mediaUrls[0])} style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', background: '#000' }} />}

          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <motion.div 
              whileTap={{ scale: 1.5 }}
              onClick={() => likePost(localPost._id)} 
              style={{ display: 'flex', gap: '8px', alignItems: 'center', color: localPost.likes?.includes(user?._id) ? '#EF4444' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Heart size={24} color={localPost.likes?.includes(user?._id) ? "#EF4444" : "var(--text-primary)"} fill={localPost.likes?.includes(user?._id) ? "#EF4444" : "transparent"} /> {localPost.likes?.length || 0}
            </motion.div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <MessageCircle size={24} /> {localPost.commentsCount || localPost.comments?.length || 0} تعليق
            </div>
          </div>

          <div style={{ padding: '24px 16px', flex: 1 }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>التعليقات</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(localPost.comments || []).map((c, i) => (
                <div key={c._id || i} style={{ display: 'flex', gap: '12px' }}>
                  <img src={getImageUrl(c.user?.avatarUrl)} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ background: 'var(--glass)', padding: '12px 16px', borderRadius: '20px', borderTopRightRadius: '4px', border: '1px solid var(--glass-border)' }}>
                      <h5 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white', marginBottom: '4px' }}>{c.user?.fullName}</h5>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', lineHeight: '1.4' }}>{c.text}</p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block', paddingRight: '8px' }}>{new Date(c.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              ))}
              {(!localPost.comments || localPost.comments.length === 0) && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>لا توجد تعليقات بعد</p>}
            </div>
          </div>
        </div>

        {/* Comment Input */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg-dark)', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '12px' }}>
          <input 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="اكتب تعليقاً..."
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            style={{ flex: 1, background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '10px 20px', color: 'white', outline: 'none' }}
          />
          <button 
            onClick={handleComment}
            style={{ background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PostDetailModal;
