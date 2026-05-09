import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send } from 'lucide-react';

const PostCard = React.memo(({ post, user, onPostClick, onLike, getImageUrl, isOwnPost, isFollowing, onFollow }) => {
  const postOwnerId = post.user?._id || post.user;

  return (
    <motion.div 
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
      {/* Header */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => onPostClick(post)}>
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
            onClick={(e) => {
              e.stopPropagation();
              onFollow(postOwnerId);
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

      {/* Media */}
      {post.mediaUrls?.[0] && (
        <div onClick={() => onPostClick(post)} style={{ cursor: 'pointer', aspectRatio: '1/1', background: '#000', overflow: 'hidden' }}>
          <motion.img 
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
            src={getImageUrl(post.mediaUrls[0])} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
          />
        </div>
      )}

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: '80px' }}>
        <div style={{ width: '4px', background: 'linear-gradient(to bottom, #3B82F6, #8B5CF6)', margin: '12px 0', borderRadius: '0 4px 4px 0', opacity: 0.8 }} />
        
        <div style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {post.text && (
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: '400', whiteSpace: 'pre-wrap' }}>
              {post.text}
            </div>
          )}

          {/* Interaction Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <motion.div 
              whileTap={{ scale: 0.8 }}
              onClick={() => onLike(post._id)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: post.likes?.includes(user?._id) ? '#EF4444' : 'rgba(255,255,255,0.6)' }}
            >
              <Heart size={18} fill={post.likes?.includes(user?._id) ? '#EF4444' : 'none'} />
              <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>{post.likes?.length || 0}</span>
            </motion.div>
            
            <motion.div 
              whileTap={{ scale: 0.8 }}
              onClick={() => onPostClick(post)}
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
});

export default PostCard;
