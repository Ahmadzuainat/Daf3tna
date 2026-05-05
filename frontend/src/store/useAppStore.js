import { create } from 'zustand';
import api from '../services/api';

export const useAppStore = create((set, get) => ({
  posts: [],
  stories: [],
  hubs: [],
  chats: [],
  users: [],       // batch users (Yearbook)
  awards: [],
  confessions: [],
  quotes: [],
  panics: [],
  instants: [],
  notebooks: [],
  timeCapsules: [],
  notifications: [],
  onlineUsers: [],    // users currently online in the batch
  typingStatus: {},  // room -> { userId, fullName }
  socket: null,
  scrollPositions: {}, // tabId -> scrollY
  pagination: {
    posts: { page: 1, hasMore: true, total: 0 }
  },
  siteSettings: null,
  globalAlert: null,
  isLoadingHubs: false,

  setSocket: (socket) => set({ socket }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setScrollPosition: (tab, position) => set(state => ({
    scrollPositions: { ...state.scrollPositions, [tab]: position }
  })),
  setTyping: (room, typingData) => set(state => ({
    typingStatus: { ...state.typingStatus, [room]: typingData }
  })),

  /* ─────────── NOTIFICATIONS ─────────── */
  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      set({ notifications: res.data });
    } catch (err) { console.error('fetchNotifications:', err); }
  },

  markNotificationsRead: async () => {
    try {
      await api.put('/notifications/mark-read');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true }))
      }));
    } catch (err) { console.error('markNotificationsRead:', err); }
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 50)
    }));
  },

  /* ─────────── POSTS ─────────── */
  fetchPosts: async (page = 1, force = false) => {
    const { pagination, posts } = get();
    if (!force && page > 1 && !pagination.posts.hasMore) return;

    try {
      const res = await api.get(`/posts?page=${page}&limit=10`);
      const newPosts = res.data.data;
      const meta = res.data.pagination;

      set({ 
        posts: page === 1 ? newPosts : [...posts, ...newPosts],
        pagination: {
          ...pagination,
          posts: { page: meta.page, hasMore: meta.page < meta.pages, total: meta.total }
        }
      });
    } catch (err) { console.error('fetchPosts:', err); }
  },

  handleNewPost: (post) => {
    set(state => {
      if (state.posts.some(p => p._id === post._id)) return state;
      return { posts: [post, ...state.posts] };
    });
  },

  handleUpdatedPost: (updatedPost) => {
    set(state => ({
      posts: state.posts.map(p => p._id === updatedPost._id ? updatedPost : p)
    }));
  },

  addPost: async (text, mediaUrl) => {
    try {
      const res = await api.post('/posts', {
        text: text || '',
        mediaUrls: mediaUrl ? [mediaUrl] : []
      });
      const newPost = res.data.data || res.data;
      set(state => ({ posts: [newPost, ...state.posts] }));
      return newPost;
    } catch (err) {
      console.error('addPost:', err);
      throw err;
    }
  },

  likePost: async (postId) => {
    try {
      const res = await api.put(`/posts/${postId}/like`);
      set(state => ({
        posts: state.posts.map(p => p._id === postId ? { ...p, likes: res.data.likesCount > p.likes.length ? [...p.likes, 'dummy'] : p.likes.slice(0, -1) } : p)
      }));
      // Note: Full sync happens via socket 'post_updated' or re-fetch
    } catch (err) { console.error('likePost:', err); }
  },

  commentPost: async (postId, text) => {
    try {
      const res = await api.post(`/posts/${postId}/comment`, { text });
      // The API returns the comment. We can update counts or re-fetch post details if modal is open.
      set(state => ({
        posts: state.posts.map(p => p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p)
      }));
      return res.data;
    } catch (err) { console.error('commentPost:', err); throw err; }
  },

  fetchPostDetails: async (postId) => {
    try {
      const res = await api.get(`/posts/${postId}`);
      return res.data;
    } catch (err) { console.error('fetchPostDetails:', err); throw err; }
  },

  /* ─────────── STORIES ─────────── */
  fetchStories: async () => {
    try {
      const res = await api.get('/stories');
      set({ stories: res.data });
    } catch (err) { console.error('fetchStories:', err); }
  },

  addStory: async (imageUrl) => {
    try {
      const res = await api.post('/stories', { imageUrl });
      set(state => ({ stories: [res.data, ...state.stories] }));
    } catch (err) { console.error('addStory:', err); }
  },

  viewStory: async (storyId) => {
    try {
      const res = await api.post(`/stories/${storyId}/view`);
      set(state => ({
        stories: state.stories.map(s =>
          s._id === storyId ? { ...s, viewedBy: res.data.viewedBy } : s
        )
      }));
    } catch (err) { console.error('viewStory:', err); }
  },

  deleteStory: async (storyId) => {
    try {
      await api.delete(`/stories/${storyId}`);
      set(state => ({
        stories: state.stories.filter(s => s._id !== storyId)
      }));
      return true;
    } catch (err) { 
      console.error('deleteStory:', err); 
      throw err;
    }
  },

  /* ─────────── HUBS ─────────── */
  fetchHubs: async () => {
    set({ isLoadingHubs: true });
    try {
      const res = await api.get('/hubs');
      set({ hubs: res.data, isLoadingHubs: false });
    } catch (err) { 
      console.error('fetchHubs:', err);
      set({ isLoadingHubs: false });
    }
  },

  joinHub: async (hubId) => {
    try {
      const res = await api.post(`/hubs/${hubId}/join`);
      set(state => ({
        hubs: state.hubs.map(h =>
          h._id === hubId ? { ...h, members: res.data.members } : h
        )
      }));
      return res.data;
    } catch (err) { console.error('joinHub:', err); throw err; }
  },

  /* ─────────── USERS / YEARBOOK ─────────── */
  fetchUsers: async () => {
    try {
      const res = await api.get('/users/batch');
      set({ users: res.data });
    } catch (err) { console.error('fetchUsers:', err); }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await api.put('/users/profile', profileData);
      return res.data;
    } catch (err) { console.error('updateProfile:', err); throw err; }
  },

  /* ─────────── CHATS (DMs) ─────────── */
  fetchChats: async () => {
    try {
      const res = await api.get('/chats');
      set({ chats: res.data });
    } catch (err) { console.error('fetchChats:', err); }
  },

  createChat: async (userId) => {
    try {
      const res = await api.post('/chats', { userId });
      set(state => {
        if (!state.chats.find(c => c._id === res.data._id)) {
          return { chats: [res.data, ...state.chats] };
        }
        return state;
      });
      return res.data;
    } catch (err) { console.error('createChat:', err); throw err; }
  },

  sendChatMessage: async (chatId, content) => {
    try {
      const res = await api.post(`/chats/${chatId}/messages`, { content });
      // Update local chat list (last message)
      set(state => ({
        chats: state.chats.map(c => c._id === chatId ? { ...c, lastMessage: res.data, updatedAt: new Date() } : c)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      }));
      return res.data;
    } catch (err) { console.error('sendChatMessage:', err); throw err; }
  },

  updateChat: (updatedChat) => {
    set(state => ({
      chats: state.chats.some(c => c._id === updatedChat._id)
        ? state.chats.map(c => c._id === updatedChat._id ? updatedChat : c)
        : [updatedChat, ...state.chats]
    }));
  },

  markChatAsRead: async (chatId) => {
    try {
      await api.put(`/chats/${chatId}/read`);
      set(state => ({
        chats: state.chats.map(c => c._id === chatId ? { ...c, unreadCount: { ...c.unreadCount, [get().userId]: 0 } } : c)
      }));
    } catch (err) { console.error('markChatAsRead:', err); }
  },

  /* ─────────── GLOBAL SOCKET HANDLERS ─────────── */
  initGlobalSocketListeners: (socket) => {
    if (!socket) return;

    // 1. Global Alert
    socket.on('global:alert', (alert) => {
      // We can use toast or a global state for this
      set({ globalAlert: alert });
    });

    // 2. Force Logout
    socket.on('force:logout', ({ reason }) => {
      // Clear storage and redirect
      localStorage.removeItem('token');
      window.location.href = '/login?reason=' + encodeURIComponent(reason);
    });

    // 3. Site Status (Maintenance/Lockdown)
    socket.on('site:statusUpdate', (settings) => {
      set({ siteSettings: settings });
    });

    // 4. DM Notifications
    socket.on('dm:newNotification', (message) => {
      // Refresh chats list to update unread badges
      get().fetchChats();
    });
  },

  /* ─────────── AWARDS ─────────── */
  fetchAwards: async () => {
    try {
      const res = await api.get('/vibes/awards');
      set({ awards: res.data });
    } catch (err) { console.error('fetchAwards:', err); }
  },

  voteAward: async (awardId) => {
    try {
      const res = await api.post(`/vibes/awards/${awardId}/vote`);
      set(state => ({
        awards: state.awards
          .map(a => a._id === awardId ? res.data : a)
          .sort((a, b) => b.votes.length - a.votes.length)
      }));
    } catch (err) {
      console.error('voteAward:', err);
      throw err;
    }
  },

  createAward: async (title, userId, duration) => {
    try {
      const res = await api.post('/vibes/awards', { title, userId, duration });
      set(state => ({ awards: [res.data, ...state.awards] }));
      return res.data;
    } catch (err) { console.error('createAward:', err); throw err; }
  },

  /* ─────────── CONFESSIONS ─────────── */
  fetchConfessions: async () => {
    try {
      const res = await api.get('/vibes/confessions');
      set({ confessions: res.data });
    } catch (err) { console.error('fetchConfessions:', err); }
  },

  addConfession: async (text) => {
    try {
      const res = await api.post('/vibes/confessions', { text });
      set(state => ({ confessions: [res.data, ...state.confessions] }));
    } catch (err) { console.error('addConfession:', err); throw err; }
  },

  /* ─────────── QUOTES ─────────── */
  fetchQuotes: async () => {
    try {
      const res = await api.get('/vibes/quotes');
      set({ quotes: res.data });
    } catch (err) { console.error('fetchQuotes:', err); }
  },

  addQuote: async (text, doctor, subject) => {
    try {
      const res = await api.post('/vibes/quotes', { text, doctor, subject });
      set(state => ({ quotes: [res.data, ...state.quotes] }));
    } catch (err) { console.error('addQuote:', err); throw err; }
  },

  /* ─────────── PANICS ─────────── */
  fetchPanics: async () => {
    try {
      const res = await api.get('/vibes/panics');
      set({ panics: res.data });
    } catch (err) { console.error('fetchPanics:', err); }
  },

  createPanic: async (text) => {
    try {
      const res = await api.post('/vibes/panics', { text });
      set(state => ({ panics: [res.data, ...state.panics] }));
      return res.data;
    } catch (err) { console.error('createPanic:', err); throw err; }
  },

  deletePanic: async (panicId) => {
    try {
      await api.delete(`/vibes/panics/${panicId}`);
      set(state => ({ panics: state.panics.filter(p => p._id !== panicId) }));
    } catch (err) { console.error('deletePanic:', err); }
  },

  replyPanic: async (panicId, text) => {
    try {
      const res = await api.post(`/vibes/panics/${panicId}/reply`, { text });
      set(state => ({
        panics: state.panics.map(p => p._id === panicId ? res.data : p)
      }));
      return res.data;
    } catch (err) { console.error('replyPanic:', err); throw err; }
  },

  /* ─────────── INSTANTS ─────────── */
  fetchInstants: async () => {
    try {
      const res = await api.get('/vibes/instants');
      set({ instants: res.data });
    } catch (err) { console.error('fetchInstants:', err); }
  },

  addInstant: async (mediaUrl) => {
    try {
      const res = await api.post('/vibes/instants', { mediaUrl });
      set(state => ({ instants: [res.data, ...state.instants] }));
      return res.data;
    } catch (err) { 
      console.error('addInstant:', err); 
      throw err; 
    }
  },

  deleteInstant: async (instantId) => {
    try {
      await api.delete(`/vibes/instants/${instantId}`);
      set(state => ({
        instants: state.instants.filter(i => i._id !== instantId)
      }));
      return true;
    } catch (err) { 
      console.error('deleteInstant:', err); 
      throw err;
    }
  },

  viewInstant: async (instantId) => {
    try {
      await api.post(`/vibes/instants/${instantId}/view`);
    } catch (err) { console.error('viewInstant:', err); }
  },

  likeInstant: async (instantId) => {
    try {
      const res = await api.post(`/vibes/instants/${instantId}/like`);
      set(state => ({
        instants: state.instants.map(i => i._id === instantId ? res.data : i)
      }));
      return res.data;
    } catch (err) { console.error('likeInstant:', err); }
  },

  /* ─────────── NOTEBOOKS ─────────── */
  fetchNotebooks: async () => {
    try {
      const res = await api.get('/vibes/notebooks');
      set({ notebooks: res.data });
    } catch (err) { console.error('fetchNotebooks:', err); }
  },

  createNotebook: async (notebookData) => {
    try {
      const res = await api.post('/vibes/notebooks', notebookData);
      set(state => ({ notebooks: [res.data, ...state.notebooks] }));
      return res.data;
    } catch (err) { console.error('createNotebook:', err); throw err; }
  },

  updateNotebook: async (id, notebookData) => {
    try {
      const res = await api.put(`/vibes/notebooks/${id}`, notebookData);
      set(state => ({
        notebooks: state.notebooks.map(n => n._id === id ? res.data : n)
      }));
      return res.data;
    } catch (err) { console.error('updateNotebook:', err); throw err; }
  },

  addNotebookMessage: async (notebookId, text) => {
    try {
      const res = await api.post(`/vibes/notebooks/${notebookId}/messages`, { text });
      set(state => ({
        notebooks: state.notebooks.map(n => n._id === notebookId ? res.data : n)
      }));
      return res.data;
    } catch (err) { console.error('addNotebookMessage:', err); throw err; }
  },

  deleteNotebookMessage: async (notebookId, messageId) => {
    try {
      const res = await api.delete(`/vibes/notebooks/${notebookId}/messages/${messageId}`);
      set(state => ({
        notebooks: state.notebooks.map(n => n._id === notebookId ? res.data : n)
      }));
    } catch (err) { console.error('deleteNotebookMessage:', err); }
  },

  toggleNotebookVisibility: async (notebookId) => {
    try {
      const res = await api.put(`/vibes/notebooks/${notebookId}/visibility`);
      set(state => ({
        notebooks: state.notebooks.map(n => n._id === notebookId ? res.data : n)
      }));
      return res.data;
    } catch (err) { console.error('toggleNotebookVisibility:', err); }
  },

  /* ─────────── TIME CAPSULE ─────────── */
  fetchTimeCapsules: async () => {
    try {
      const res = await api.get('/vibes/time-capsules');
      set({ timeCapsules: res.data });
    } catch (err) { console.error('fetchTimeCapsules:', err); }
  },

  createTimeCapsule: async (capsuleData) => {
    try {
      const res = await api.post('/vibes/time-capsules', capsuleData);
      set(state => ({ timeCapsules: [res.data, ...state.timeCapsules] }));
      return res.data;
    } catch (err) { 
      console.error('createTimeCapsule:', err); 
      throw err; 
    }
  },

  /* ─────────── FOLLOWS ─────────── */
  fetchUserProfile: async (usernameOrId) => {
    try {
      const res = await api.get(`/users/${usernameOrId}`);
      return res.data;
    } catch (err) { console.error('fetchUserProfile:', err); }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await api.put('/users/profile', profileData);
      return res.data;
    } catch (err) { 
      console.error('updateProfile:', err); 
      throw err; 
    }
  },

  followUser: async (userId) => {
    try {
      const res = await api.post(`/users/${userId}/follow`);
      return res.data; // { success, status, message }
    } catch (err) { console.error('followUser:', err); throw err; }
  },

  acceptFollowRequest: async (userId) => {
    try {
      const res = await api.post(`/users/${userId}/accept-request`);
      return res.data;
    } catch (err) { console.error('acceptFollowRequest:', err); throw err; }
  },

  rejectFollowRequest: async (userId) => {
    try {
      const res = await api.post(`/users/${userId}/reject-request`);
      return res.data;
    } catch (err) { console.error('rejectFollowRequest:', err); throw err; }
  },

  fetchUserPosts: async (userId) => {
    try {
      const res = await api.get(`/posts/user/${userId}`);
      return res.data;
    } catch (err) { console.error('fetchUserPosts:', err); throw err; }
  },

  updatePost: async (postId, text) => {
    try {
      const res = await api.put(`/posts/${postId}`, { text });
      set(state => ({
        posts: state.posts.map(p => p._id === postId ? res.data : p)
      }));
      return res.data;
    } catch (err) {
      console.error('updatePost:', err);
      throw err;
    }
  },

  deletePost: async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      set(state => ({ posts: state.posts.filter(p => p._id !== postId) }));
    } catch (err) { console.error('deletePost:', err); }
  },
}));
