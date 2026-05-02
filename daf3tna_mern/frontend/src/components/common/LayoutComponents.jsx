import React, { useEffect } from 'react';
import { Bell, Send, Heart, MessageCircle, User, AlertCircle, Check, AlertTriangle, X, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';

export const GlobalHeader = ({ user, onProfileClick, onMessagesClick, onNotificationsClick, unreadCount }) => {
  return (
    <header style={{ 
      background: 'var(--nav-bg)', 
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'sticky', top: 0, zIndex: 1000,
      width: '100%'
    }}>
      <div style={{ 
        maxWidth: '1200px', margin: '0 auto', display: 'flex', 
        alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '50%', background: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', fontStyle: 'italic' }}>D</span>
          </div>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1' }}>دفعتنا</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '2px' }}>
              {user?.university || 'AL AL-BAYT UNIVERSITY'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', cursor: 'pointer', padding: '8px' }} onClick={onNotificationsClick}>
             <Bell size={22} color="var(--text-primary)" />
             {unreadCount > 0 && <span className="badge-counter">{unreadCount}</span>}
          </div>
          <div style={{ position: 'relative', cursor: 'pointer', padding: '8px' }} onClick={onMessagesClick}>
            <Send size={22} color="var(--text-primary)" />
          </div>
          <img onClick={onProfileClick} src={user?.avatarUrl || "https://ui-avatars.com/api/?name=Guest&background=111&color=fff"} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--glass-border)', objectFit: 'cover', cursor: 'pointer' }} />
        </div>
      </div>
    </header>
  );
};

export const NotificationDrawer = ({ isOpen, onClose, onPostClick, onUserClick }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const { notifications, fetchNotifications, markNotificationsRead, acceptFollowRequest, rejectFollowRequest } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
    return () => {
      if (isOpen) markNotificationsRead();
    };
  }, [isOpen, fetchNotifications, markNotificationsRead]);

  const getIcon = (type) => {
    switch(type) {
      case 'like': return <Heart size={18} color="#EF4444" fill="#EF4444" />;
      case 'comment': return <MessageCircle size={18} color="#3B82F6" />;
      case 'follow': return <User size={18} color="#10B981" />;
      case 'follow_request': return <AlertCircle size={18} color="#F59E0B" />;
      case 'follow_accept': return <Check size={18} color="#10B981" />;
      case 'panic': return <AlertTriangle size={18} color="#EF4444" />;
      default: return <Bell size={18} color="white" />;
    }
  };

  const handleAction = async (e, id, type, senderId) => {
    e.stopPropagation();
    if (type === 'accept') {
      await acceptFollowRequest(senderId);
      toast.success(t('follow_accepted'));
    } else {
      await rejectFollowRequest(senderId);
      toast.info(t('follow_rejected'));
    }
    fetchNotifications();
  };

  const handleNotifClick = (n) => {
    onClose();
    if (n.post) {
      onPostClick(n.post);
    } else if (n.sender) {
      onUserClick(n.sender);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
          />
          <motion.div 
            initial={{ x: isRTL ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ 
              position: 'fixed', 
              top: 0, 
              [isRTL ? 'right' : 'left']: 0, 
              bottom: 0, 
              width: '100%', 
              maxWidth: '400px', 
              background: 'var(--bg-dark)', 
              zIndex: 1001,
              boxShadow: isRTL ? '-10px 0 30px rgba(0,0,0,0.5)' : '10px 0 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: isRTL ? '1px solid rgba(255,255,255,0.1)' : 'none',
              borderRight: !isRTL ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}
          >
            <header style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bell size={24} color="var(--primary-blue)" />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{t('notifications')}</h2>
              </div>
              <X onClick={onClose} size={24} color="var(--text-primary)" style={{ cursor: 'pointer' }} />
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifications.length > 0 ? notifications.map((n, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={n._id} 
                    className="glass-card" 
                    style={{ 
                      padding: '12px 16px', 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center', 
                      background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(59, 130, 246, 0.05)',
                      borderLeft: n.isRead ? '1px solid rgba(255,255,255,0.05)' : '3px solid var(--primary-blue)', 
                      borderRadius: '16px',
                      cursor: 'pointer',
                    }}
                    whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.05)' }}
                    onClick={() => handleNotifClick(n)}
                  >
                    <div style={{ position: 'relative' }}>
                      <img src={n.sender?.avatarUrl || `https://ui-avatars.com/api/?name=${n.sender?.fullName}&background=111&color=fff`} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)' }} />
                      <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--bg-dark)', borderRadius: '50%', padding: '3px', border: '1px solid var(--glass-border)' }}>
                        {getIcon(n.type)}
                      </div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                        <span style={{ fontWeight: 'bold' }}>{n.sender?.fullName}</span> {
                          n.type === 'like' ? t('notif_like') :
                          n.type === 'comment' ? t('notif_comment') :
                          n.type === 'follow' ? t('notif_follow') : 
                          n.type === 'follow_request' ? t('notif_follow_request') :
                          n.type === 'follow_accept' ? t('notif_follow_accept') :
                          n.type === 'profile_visit' ? t('notif_profile_visit') : t('notif_interact')
                        }
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <Timer size={12} color="var(--text-secondary)" />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {n.type === 'follow_request' && !n.isRead && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button 
                            onClick={(e) => handleAction(e, n._id, 'accept', n.sender._id)}
                            style={{ flex: 1, background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '6px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            {t('accept')}
                          </button>
                          <button 
                            onClick={(e) => handleAction(e, n._id, 'reject', n.sender._id)}
                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #333', padding: '6px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            {t('reject')}
                          </button>
                        </div>
                      )}
                    </div>

                    {n.post && n.post.mediaUrls?.[0] && (
                       <img src={n.post.mediaUrls[0]} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                    )}
                  </motion.div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Bell size={40} color="var(--text-secondary)" style={{ marginBottom: '12px', opacity: 0.3 }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('no_notifications')}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
