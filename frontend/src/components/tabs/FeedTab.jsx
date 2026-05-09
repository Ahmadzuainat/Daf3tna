import React, { useEffect, useState, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Repeat, Plus, Send, X, Camera, Zap, Check, MoreVertical, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const PostSkeleton = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '0 4px' }}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
      <div key={i} style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
    ))}
  </div>
);

const FeedTab = ({ selectedPost, setSelectedPost }) => {
  const { 
    posts, stories, fetchPosts, fetchStories, likePost, commentPost, 
    deleteComment, addStory, deleteStory, viewStory, onlineUsers, 
    pagination, setScrollPosition, scrollPositions, deletePost, 
    updatePost, fetchPostDetails 
  } = useAppStore(useShallow(state => ({
    posts: state.posts,
    stories: state.stories,
    fetchPosts: state.fetchPosts,
    fetchStories: state.fetchStories,
    likePost: state.likePost,
    commentPost: state.commentPost,
    deleteComment: state.deleteComment,
    addStory: state.addStory,
    deleteStory: state.deleteStory,
    viewStory: state.viewStory,
    onlineUsers: state.onlineUsers,
    pagination: state.pagination,
    setScrollPosition: state.setScrollPosition,
    scrollPositions: state.scrollPositions,
    deletePost: state.deletePost,
    updatePost: state.updatePost,
    fetchPostDetails: state.fetchPostDetails
  })));
  const { user } = useAuthStore();
  const [commentText, setCommentText] = useState('');
  const [viewingStory, setViewingStory] = useState(null);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts(1);
      fetchStories();
    }
  }, []);

  // Restore scroll position
  useEffect(() => {
    if (scrollRef.current && scrollPositions.feed) {
      scrollRef.current.scrollTop = scrollPositions.feed;
    }
  }, [scrollPositions.feed]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setScrollPosition('feed', scrollTop);

    if (scrollHeight - scrollTop <= clientHeight + 200 && pagination.posts.hasMore) {
      fetchPosts(pagination.posts.page + 1);
    }
  };

  const handleStoryUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/stories', formData);
        toast.success('تمت إضافة القصة');
        fetchStories(); // Refresh stories
      } catch(err) {
        toast.error('خطأ في رفع القصة');
      }
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost?._id) return;
    try {
      const newComment = await commentPost(selectedPost._id, commentText);
      setCommentText('');
      // Update the local state of selectedPost to include the new comment
      setSelectedPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
        commentsCount: (prev.commentsCount || 0) + 1
      }));
    } catch (err) {
      toast.error('فشل إضافة التعليق');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
    try {
      await deleteComment(postId, commentId);
      setSelectedPost(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c._id !== commentId),
        commentsCount: Math.max(0, (prev.commentsCount || 0) - 1)
      }));
      toast.success('تم حذف التعليق');
    } catch (err) {
      toast.error('فشل حذف التعليق');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنشور؟')) return;
    try {
      await deletePost(postId);
      setSelectedPost(null);
      toast.success('تم حذف المنشور');
    } catch (err) {
      toast.error('فشل حذف المنشور');
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القصة؟')) return;
    try {
      await deleteStory(storyId);
      setViewingStory(null);
      toast.success('تم حذف القصة');
    } catch (err) {
      toast.error('فشل حذف القصة');
    }
  };

  const handlePostClick = async (post) => {
    try {
      const details = await fetchPostDetails(post._id);
      setSelectedPost(details);
      setEditText(details.text || '');
      setIsEditingPost(false);
    } catch (err) {
      setSelectedPost(post);
      setEditText(post.text || '');
      setIsEditingPost(false);
      toast.error('فشل تحميل تفاصيل المنشور');
    }
  };

  const handleUpdatePost = async () => {
    if (!editText.trim()) return toast.error('النص لا يمكن أن يكون فارغاً');
    try {
      const updated = await updatePost(selectedPost._id, editText);
      setSelectedPost(prev => ({ ...prev, text: updated.text }));
      setIsEditingPost(false);
      toast.success('تم تحديث المنشور');
    } catch (err) {
      toast.error('فشل تحديث المنشور');
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "https://ui-avatars.com/api/?name=User&background=random";
    if (url.startsWith('http')) return url;
    
    const baseUrl = import.meta.env.VITE_API_URL || 'https://daf3tna.onrender.com';
    const cleanBase = baseUrl.replace(/\/api\/?$/, '');
    return `${cleanBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div 
      ref={scrollRef}
      className="hide-scrollbar" 
      onScroll={handleScroll} 
      style={{ paddingTop: '16px', overflowY: 'auto', height: 'calc(100vh - 80px)', scrollbarWidth: 'none' }}
    >
      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div style={{ padding: '0 16px 16px 16px' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
            متصل الآن ({onlineUsers.length})
          </h4>
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
            {onlineUsers.map(u => (
              <div key={u._id} style={{ position: 'relative', flexShrink: 0 }}>
                <img src={getImageUrl(u.avatarUrl)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #10B981', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#10B981', borderRadius: '50%', border: '2px solid var(--bg-dark)' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stories */}
      <div className="hide-scrollbar" style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '0 16px 24px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '84px', cursor: 'pointer' }}>
          <input type="file" id="storyUpload" style={{ display: 'none' }} accept="image/*" onChange={handleStoryUpload} />
          <label htmlFor="storyUpload" style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--glass-border)', cursor: 'pointer' }}>
            <Plus size={32} color="var(--text-primary)" />
          </label>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '500' }}>إضافة قصة</span>
        </div>

        {stories.map((story) => {
          const isViewed = story.viewers?.includes(user?._id);
          return (
            <div key={story._id} onClick={() => { setViewingStory(story); viewStory(story._id); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '84px', cursor: 'pointer' }}>
              <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: !isViewed ? 'linear-gradient(135deg, #F59E0B, #EF4444, #D946EF)' : 'rgba(255,255,255,0.2)', padding: '3px' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'var(--bg-dark)', border: '2px solid var(--bg-dark)', overflow: 'hidden' }}>
                  <img src={getImageUrl(story.mediaUrl)} alt={story.user?.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '500' }}>{story.user?.fullName?.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>

      {/* Modern Separator */}
      <div style={{ padding: '8px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', whiteSpace: 'nowrap' }}>
            المنشورات الأخيرة
          </span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }} />
        </div>
      </div>

      {/* Posts Grid (3 Columns of Instagram Cards) */}
      <div style={{ padding: '0 8px 32px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '16px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {posts.map(post => {
            const postOwnerId = post.user?._id || post.user;
            const isOwnPost = postOwnerId === user?._id;
            const isFollowing = user?.following?.includes(postOwnerId);

            return (
              <motion.div 
                key={post._id} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
                style={{ 
                  background: 'rgba(30, 41, 59, 0.5)', 
                  backdropFilter: 'blur(12px)',
                  borderRadius: '20px', 
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'fit-content',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Modern Header */}
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => handlePostClick(post)}>
                    <div style={{ position: 'relative', padding: '2px', background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)', borderRadius: '50%' }}>
                      <img 
                        src={getImageUrl(post.user?.avatarUrl)} 
                        style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1e293b', objectFit: 'cover', display: 'block' }} 
                      />
                    </div>
                    <h4 style={{ color: 'white', fontWeight: '600', fontSize: '0.85rem', letterSpacing: '0.3px' }}>
                      {post.user?.fullName || 'User'}
                    </h4>
                  </div>
                  
                  {!isOwnPost && !isFollowing && (
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const { followUser } = useAppStore.getState();
                          await followUser(postOwnerId);
                        } catch (err) {}
                      }}
                      style={{ 
                        background: 'rgba(59, 130, 246, 0.15)', 
                        color: '#60A5FA', 
                        border: '1px solid rgba(59, 130, 246, 0.3)', 
                        padding: '4px 12px', 
                        borderRadius: '10px', 
                        fontSize: '0.7rem', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      متابعة
                    </button>
                  )}
                </div>

                {/* Micro Media (Centerpiece - Square) */}
                {post.mediaUrls?.[0] && (
                  <div onClick={() => handlePostClick(post)} style={{ cursor: 'pointer', aspectRatio: '1/1', background: '#000', overflow: 'hidden' }}>
                    <motion.img 
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      src={getImageUrl(post.mediaUrls[0])} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                    />
                  </div>
                )}

                {/* Content Area with Premium Vertical Line */}
                <div style={{ display: 'flex', flex: 1, minHeight: '80px' }}>
                  {/* The Vertical Line Accent (Gradient) */}
                  <div style={{ width: '4px', background: 'linear-gradient(to bottom, #3B82F6, #8B5CF6)', margin: '12px 0', borderRadius: '0 4px 4px 0', opacity: 0.8 }} />
                  
                  <div style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Micro Text */}
                    {post.text && (
                      <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: '400', whiteSpace: 'pre-wrap' }}>
                        {post.text}
                      </div>
                    )}

                    {/* Modern Interaction Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <motion.div 
                        whileTap={{ scale: 0.8 }}
                        onClick={() => likePost(post._id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: post.likes?.includes(user?._id) ? '#EF4444' : 'rgba(255,255,255,0.6)' }}
                      >
                        <Heart size={18} fill={post.likes?.includes(user?._id) ? '#EF4444' : 'none'} />
                        <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>{post.likes?.length || 0}</span>
                      </motion.div>
                      
                      <motion.div 
                        whileTap={{ scale: 0.8 }}
                        onClick={() => handlePostClick(post)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}
                      >
                        <MessageCircle size={18} />
                        <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>{post.commentsCount || 0}</span>
                      </motion.div>

                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                         <Send size={16} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        {posts.length === 0 && <PostSkeleton />}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <div 
          onClick={() => setSelectedPost(null)} 
          style={{ 
            position: 'fixed', inset: 0, 
            background: 'rgba(10, 15, 28, 0.8)', 
            backdropFilter: 'blur(12px)', 
            zIndex: 3000, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <motion.div 
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            style={{ 
              width: '95%', 
              maxWidth: '420px', 
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
              onClick={() => setSelectedPost(null)}
              style={{ 
                position: 'absolute', top: '12px', left: '12px', 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '50%', padding: '6px', 
                cursor: 'pointer', zIndex: 10,
                transition: 'all 0.2s'
              }}
            >
              <X size={16} color="white" />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }} className="hide-scrollbar">
              <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={getImageUrl(selectedPost.user?.avatarUrl)} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #3b82f6', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'white' }}>{selectedPost.user?.fullName || 'User'}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{new Date(selectedPost.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>

                {( (selectedPost.user?._id || selectedPost.user) === user?._id || ['admin', 'superadmin', 'moderator'].includes(user?.role) ) && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setIsEditingPost(!isEditingPost)}
                      style={{ background: isEditingPost ? '#f59e0b' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}
                    >
                      <Edit size={18} color={isEditingPost ? 'white' : '#f59e0b'} />
                    </button>
                    <button 
                      onClick={() => handleDeletePost(selectedPost._id)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </button>
                  </div>
                )}
              </div>

            {isEditingPost ? (
              <div style={{ padding: '0 16px 16px 16px' }}>
                <textarea 
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', padding: '12px', minHeight: '100px', marginBottom: '12px', outline: 'none' }}
                />
                <button 
                  onClick={handleUpdatePost}
                  style={{ background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '10px', fontWeight: 'bold' }}
                >
                  حفظ التعديلات
                </button>
              </div>
            ) : (
              selectedPost.text && <p style={{ padding: '0 16px', fontSize: '1.1rem', lineHeight: '1.5', marginBottom: '16px', color: 'white', whiteSpace: 'pre-wrap' }}>{selectedPost.text}</p>
            )}

            {selectedPost.mediaUrls?.[0] && <img src={getImageUrl(selectedPost.mediaUrls[0])} style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', background: '#000' }} />}

            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <motion.div 
                whileTap={{ scale: 1.5 }}
                onClick={() => { if(selectedPost._id) { likePost(selectedPost._id); } }} 
                style={{ display: 'flex', gap: '8px', alignItems: 'center', color: selectedPost.likes?.includes(user?._id) ? '#EF4444' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <Heart size={24} color={selectedPost.likes?.includes(user?._id) ? "#EF4444" : "var(--text-primary)"} fill={selectedPost.likes?.includes(user?._id) ? "#EF4444" : "transparent"} /> {selectedPost.likes?.length || 0}
              </motion.div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <MessageCircle size={24} /> {selectedPost.commentsCount || selectedPost.comments?.length || 0} تعليق
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <Repeat size={24} /> إعادة نشر
              </div>
            </div>

            <div style={{ padding: '24px 16px', flex: 1 }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>التعليقات</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(selectedPost.comments || []).map((c, i) => (
                  <div key={c._id || i} style={{ display: 'flex', gap: '12px', animation: 'fadeInUp 0.3s ease-out' }}>
                    <img src={c.user?.avatarUrl || "https://ui-avatars.com/api/?name=User"} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ background: 'var(--glass)', padding: '12px 16px', borderRadius: '20px', borderTopRightRadius: '4px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>{c.user?.fullName}</span>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', opacity: 0.9, lineHeight: '1.4' }}>{c.text}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', padding: '4px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                        <span style={{ cursor: 'pointer' }}>إعجاب</span>
                        <span style={{ cursor: 'pointer' }}>رد</span>
                        {(c.user?._id === user?._id || (selectedPost.user?._id || selectedPost.user) === user?._id || ['admin', 'superadmin', 'moderator'].includes(user?.role)) && (
                          <span onClick={() => handleDeleteComment(selectedPost._id, c._id)} style={{ cursor: 'pointer', color: '#EF4444' }}>حذف</span>
                        )}
                        <span>{new Date(c.createdAt).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--nav-bg)', position: 'sticky', bottom: 0, borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', background: 'var(--glass)', borderRadius: '24px', padding: '8px 16px', alignItems: 'center', border: '1px solid var(--glass-border)' }}>
                <input 
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '8px', outline: 'none', fontSize: '1rem' }} 
                  placeholder="أضف تعليقاً..." 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                />
                <Send onClick={handleAddComment} size={24} color={commentText ? "var(--primary-blue)" : "var(--text-secondary)"} style={{ cursor: 'pointer', transition: 'color 0.2s' }} />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {viewingStory && (
        <div 
          onClick={() => setViewingStory(null)} 
          style={{ 
            position: 'fixed', inset: 0, 
            background: 'rgba(0,0,0,0.9)', 
            zIndex: 4000, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{ 
              width: '100%', maxWidth: '420px', height: '90vh', 
              background: '#000', borderRadius: '24px', position: 'relative', overflow: 'hidden',
              boxShadow: '0 0 40px rgba(0,0,0,0.5)'
            }}
          >
          <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', gap: '4px' }}>
            <div style={{ flex: 1, height: '3px', background: 'white', borderRadius: '2px' }} />
          </div>
          <header style={{ position: 'absolute', top: '32px', left: '16px', right: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 301 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={viewingStory.user?.avatarUrl || "https://ui-avatars.com/api/?name=User"} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', objectFit: 'cover' }} />
              <span style={{ color: 'white', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{viewingStory.user?.fullName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {((viewingStory.user?._id || viewingStory.user) === user?._id || ['admin', 'superadmin', 'moderator'].includes(user?.role)) && (
                <Trash2 size={24} color="white" onClick={() => handleDeleteStory(viewingStory._id)} style={{ cursor: 'pointer', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }} />
              )}
              <X size={32} color="white" onClick={() => setViewingStory(null)} style={{ cursor: 'pointer', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }} />
            </div>
          </header>
          <img src={getImageUrl(viewingStory.mediaUrl)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onClick={() => setViewingStory(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedTab;
