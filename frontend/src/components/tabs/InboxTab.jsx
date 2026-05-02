import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search as SearchIcon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

const InboxTab = ({ onChatClick, onBack }) => {
  const { chats, fetchChats } = useAppStore();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const filteredChats = chats.filter(c => {
    const otherUser = c.participants.find(p => p._id !== user._id);
    return otherUser?.fullName?.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-dark)' }}>
      <header style={{ padding: '24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <ChevronLeft size={28} onClick={onBack} style={{ cursor: 'pointer', color: 'white' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>الرسائل الخاصة</h2>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
          <SearchIcon color="var(--text-secondary)" size={20} style={{ marginRight: '12px' }} />
          <input 
            style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }} 
            placeholder="بحث في الرسائل..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {filteredChats.map(chat => {
          const otherUser = chat.participants.find(p => p._id !== user._id);
          if (!otherUser) return null;
          const unread = chat.unreadCount?.[user?._id] > 0;
          return (
            <div key={chat._id} onClick={() => onChatClick(chat)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)', background: unread ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
              <div style={{ position: 'relative' }}>
                <img src={otherUser.avatarUrl || "https://ui-avatars.com/api/?name=User"} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: unread ? '2px solid var(--primary-blue)' : 'none' }} />
                {unread && <div style={{ position: 'absolute', top: 0, right: 0, width: '14px', height: '14px', background: 'var(--primary-blue)', borderRadius: '50%', border: '2px solid var(--bg-dark)' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4 style={{ fontWeight: unread ? '900' : 'bold', fontSize: '1.1rem', color: 'white' }}>{otherUser.fullName}</h4>
                  <span style={{ fontSize: '0.8rem', color: unread ? 'var(--primary-blue)' : 'var(--text-secondary)', fontWeight: unread ? 'bold' : 'normal' }}>{chat.lastMessage ? new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'الآن'}</span>
                </div>
                <p style={{ color: unread ? 'white' : 'var(--text-secondary)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px', fontWeight: unread ? '500' : 'normal' }}>
                  {chat.lastMessage?.content || 'لا يوجد رسائل بعد'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InboxTab;
