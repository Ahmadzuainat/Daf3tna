import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Search as SearchIcon, PlusSquare, Flame, BookOpen, User, 
  Settings, ChevronLeft, Bell, Send, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

// Stores
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

// Components
import FeedTab from '../components/tabs/FeedTab';
import SearchTab from '../components/tabs/SearchTab';
import VibesTab from '../components/tabs/VibesTab';
import YearbookTab from '../components/tabs/YearbookTab';
import ProfileTab from '../components/tabs/ProfileTab';
import SettingsTab from '../components/tabs/SettingsTab';
import HubsListTab from '../components/tabs/HubsListTab';
import HubPreviewTab from '../components/tabs/HubPreviewTab';
import HubOpenView from '../components/hubs/HubOpenView';
import InboxTab from '../components/tabs/InboxTab';
import DMChatTab from '../components/tabs/DMChatTab';
import { GlobalHeader, NotificationDrawer } from '../components/common/LayoutComponents';

// Services
import api from '../services/api';

const getRawBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || 'https://daf3tna.onrender.com';
  return url.endsWith('/api') ? url.replace('/api', '') : url;
};

const API_BASE_URL = getRawBaseURL();

const getSocketURL = () => {
  return API_BASE_URL;
};

const SOCKET_URL = getSocketURL();

const HomePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { 
    setSocket, handleNewPost, handleUpdatedPost, joinHub: joinHubAction, 
    fetchHubs, notifications, addNotification, fetchNotifications, 
    setOnlineUsers, setTyping, updateChat, socket 
  } = useAppStore();

  // Navigation State
  const [activeTab, setActiveTab] = useState('feed');
  const [activeVibe, setActiveVibe] = useState(null);
  
  // Selection State
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedHub, setSelectedHub] = useState(null);
  const [selectedDMUser, setSelectedDMUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // UI State
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [joiningHub, setJoiningHub] = useState(false);

  // Apply Theme & Language from User Profile
  useEffect(() => {
    if (user) {
      if (user.theme) {
        document.body.setAttribute('data-theme', user.theme);
      }
      if (user.language) {
        i18n.changeLanguage(user.language);
        document.documentElement.lang = user.language;
        document.documentElement.dir = user.language === 'ar' ? 'rtl' : 'ltr';
      }
    }
  }, [user, i18n]);

  // Socket Connection & Listeners
  useEffect(() => {
    if (user) {
      const socketInstance = io(SOCKET_URL);
      socketInstance.emit('setup', user);
      setSocket(socketInstance);

      // Initialize Global Listeners (Alerts, Force Logout, etc.)
      useAppStore.getState().initGlobalSocketListeners(socketInstance);

      // Only fetch if empty to avoid double-loading on quick transitions
      const { hubs, notifications } = useAppStore.getState();
      if (hubs.length === 0) fetchHubs();
      if (notifications.length === 0) fetchNotifications();

      socketInstance.on('online_users_update', (users) => setOnlineUsers(users));
      socketInstance.on('dm:newNotification', (msg) => {
        addNotification({
          _id: Date.now(),
          type: 'message',
          sender: msg.sender,
          message: `رسالة جديدة من ${msg.sender.fullName}`,
          createdAt: new Date()
        });
        fetchNotifications();
      });
      
      socketInstance.on('notification_received', (notif) => addNotification(notif));
      socketInstance.on('new_post', (post) => handleNewPost(post));
      socketInstance.on('post_updated', (post) => handleUpdatedPost(post));
      socketInstance.on('chat_updated', (chat) => updateChat(chat));

      socketInstance.on('global:alert', (data) => {
        toast.error(`🚨 ${data.message}`, {
          duration: 15000,
          description: `بواسطة: ${data.sender}`
        });
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user, setSocket, handleNewPost, handleUpdatedPost, fetchHubs, addNotification, fetchNotifications, setOnlineUsers, setTyping, updateChat]);

  // Handlers
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'profile') setSelectedProfile(null);
    if (tab === 'vibes') setActiveVibe(null);
  };

  const isMember = (hub, userId) => {
    if (!hub || !userId) return false;
    if (hub.isJoined) return true;
    const uid = userId.toString();
    return hub.members?.some(m => (m._id || m).toString() === uid);
  };

  const openProfile = (userObj) => {
    setSelectedProfile(userObj);
    setActiveTab('profile');
    if (socket && userObj?._id && userObj._id !== user?._id) {
      socket.emit('visit_profile', { visitorId: user._id, visitedId: userObj._id });
    }
  };

  const handleHubClick = (hub) => {
    setSelectedHub(hub);
    if (isMember(hub, user?._id)) {
      setActiveTab('hub_server');
    } else {
      setActiveTab('hub_preview');
    }
  };

  const joinHub = async (hub) => {
    if (!hub?._id) return;
    setJoiningHub(true);
    try {
      await joinHubAction(hub._id);
      await fetchHubs();
      const latestHubs = useAppStore.getState().hubs;
      const updated = latestHubs.find(h => h._id === hub._id);
      setSelectedHub(updated || { ...hub, isJoined: true });
      setActiveTab('hub_server');
    } catch (err) { 
      console.error('Join Error:', err);
      setSelectedHub({ ...hub, isJoined: true });
      setActiveTab('hub_server');
    } finally { 
      setJoiningHub(false); 
    }
  };

  const openDMChat = (dmUser) => {
    setSelectedDMUser(dmUser);
    setActiveTab('dm_chat');
  };

  const refreshUI = () => setRefreshKey(prev => prev + 1);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const messageCount = useAppStore.getState().chats.reduce((acc, c) => acc + (c.unreadCount?.[user?._id] || 0), 0);

  const isFullScreen = ['hub_preview', 'hub_server', 'inbox', 'dm_chat', 'vibes', 'notifications', 'settings'].includes(activeTab);

  return (
    <div key={refreshKey} className="app-container">
      
      {!isFullScreen && activeTab !== 'profile' && (
        <GlobalHeader 
          user={user} 
          onProfileClick={() => handleTabChange('profile')} 
          onMessagesClick={() => setActiveTab('inbox')} 
          onNotificationsClick={() => setShowNotifDrawer(true)}
          unreadCount={unreadCount}
          messageCount={messageCount}
        />
      )}

      <NotificationDrawer 
        isOpen={showNotifDrawer} 
        onClose={() => setShowNotifDrawer(false)} 
        onPostClick={(p) => { setSelectedPost(p); setActiveTab('feed'); }}
        onUserClick={openProfile}
      />

      <div style={{ flex: 1, paddingBottom: isFullScreen ? '0' : '80px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '100%', maxWidth: isFullScreen ? '100%' : '1200px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              {activeTab === 'feed' && <FeedTab selectedPost={selectedPost} setSelectedPost={setSelectedPost} />}
              {activeTab === 'search' && <SearchTab onUserClick={openProfile} />}
              {activeTab === 'hubs' && <HubsListTab onHubClick={handleHubClick} />}
              {activeTab === 'vibes' && <VibesTab activeVibe={activeVibe} setActiveVibe={setActiveVibe} onExitFullScreen={() => handleTabChange('feed')} />}
              {activeTab === 'hub_preview' && (
                <HubPreviewTab 
                  hub={selectedHub} 
                  onBack={() => setActiveTab('hubs')} 
                  onJoin={() => joinHub(selectedHub)} 
                  joiningHub={joiningHub} 
                  isJoined={isMember(selectedHub, user?._id)}
                />
              )}
              {activeTab === 'hub_server' && <HubOpenView hub={selectedHub} onBack={() => setActiveTab('hubs')} />}
              {activeTab === 'inbox' && <InboxTab onChatClick={openDMChat} onBack={() => setActiveTab('feed')} />}
              {activeTab === 'dm_chat' && <DMChatTab user={selectedDMUser} onBack={() => setActiveTab('inbox')} />}
              {activeTab === 'yearbook' && <YearbookTab onUserClick={openProfile} />}
              {activeTab === 'profile' && <ProfileTab user={selectedProfile || user} isOwnProfile={!selectedProfile} onContentAdded={refreshUI} onSettingsClick={() => setActiveTab('settings')} setSelectedPost={setSelectedPost} />}
              {activeTab === 'settings' && <SettingsTab onBack={() => setActiveTab('profile')} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {!isFullScreen && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--nav-bg)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--glass-border)', padding: '16px 24px', display: 'flex', justifyContent: 'center', zIndex: 100 }}>
          <div className="bottom-nav-inner">
            {[
              { id: 'feed', icon: Home },
              { id: 'search', icon: SearchIcon },
              { id: 'hubs', icon: PlusSquare },
              { id: 'vibes', icon: Flame },
              { id: 'yearbook', icon: BookOpen },
              { id: 'profile', icon: User },
            ].map(tab => (
              <div 
                key={tab.id} 
                onClick={() => handleTabChange(tab.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.2s' }}
              >
                <tab.icon size={28} fill={(activeTab === tab.id || (tab.id === 'profile' && activeTab === 'profile')) && tab.id !== 'hubs' && tab.id !== 'vibes' ? 'var(--text-primary)' : 'none'} color={(activeTab === tab.id || (tab.id === 'profile' && activeTab === 'profile')) ? (tab.id === 'vibes' ? '#F59E0B' : 'var(--text-primary)') : 'var(--text-secondary)'} />
              </div>
            ))}
            
            {user && ['moderator', 'admin', 'superadmin'].includes(user.role) && (
              <div 
                onClick={() => navigate('/admin')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'color 0.2s' }}
              >
                <Shield size={28} color="#8b5cf6" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
