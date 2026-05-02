import React, { useState, useEffect } from 'react';
import { ArrowRight, Phone, Video, PlusSquare, Send } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import api from '../../services/api';

const DMChatTab = ({ user: chat, onBack }) => {
  const { user: authUser } = useAuthStore();
  const { socket } = useAppStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const otherUser = chat.participants?.find(p => p._id !== authUser._id) || chat;

  useEffect(() => {
    if (chat._id) {
      api.get(`/chats/${chat._id}/messages`).then(res => setMessages(res.data));
      if (socket) {
        socket.emit('join_room', chat._id);
        // Mark as read
        api.put(`/chats/${chat._id}/read`);
      }
    }

    if (socket) {
      const handleMsg = (msg) => {
        if (msg.chatId === chat._id) {
          setMessages(prev => {
            if (prev.find(m => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          api.put(`/chats/${chat._id}/read`);
        }
      };
      socket.on('receive_message', handleMsg);
      return () => socket.off('receive_message', handleMsg);
    }
  }, [chat._id, socket, authUser._id]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    const msgData = { chatId: chat._id, content: newMessage, sender: authUser._id };
    socket.emit('send_message', msgData);
    setMessages(prev => [...prev, { ...msgData, sender: authUser, createdAt: new Date() }]);
    setNewMessage('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', background: 'var(--bg-dark)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ArrowRight size={28} onClick={onBack} style={{ cursor: 'pointer', color: 'white' }} />
          <img src={otherUser.avatarUrl || "https://ui-avatars.com/api/?name=User"} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{otherUser.fullName || otherUser.name}</h2>
            <span style={{ fontSize: '0.8rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }} /> متصل
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', color: 'var(--primary-blue)' }}>
          <Phone size={24} style={{ cursor: 'pointer' }} />
          <Video size={24} style={{ cursor: 'pointer' }} />
        </div>
      </header>

      <div style={{ flex: 1, padding: '24px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <img src={otherUser.avatarUrl || "https://ui-avatars.com/api/?name=User"} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' }} />
          <h2 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{otherUser.fullName || otherUser.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>مراسلة آمنة</p>
        </div>
        
        {messages.map((msg, i) => {
          const isMe = msg.sender?._id === authUser._id || msg.sender === authUser._id;
          return (
            <div key={msg._id || i} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
              {!isMe && <img src={otherUser.avatarUrl || "https://ui-avatars.com/api/?name=User"} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />}
              <div style={{ 
                background: isMe ? 'var(--gradient-btn)' : 'var(--surface-dark)', 
                padding: '12px 16px', borderRadius: '20px', 
                borderBottomRightRadius: isMe ? '4px' : '20px', borderBottomLeftRadius: !isMe ? '4px' : '20px',
                color: 'white', maxWidth: '75%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <p style={{ margin: 0, lineHeight: '1.4' }}>{msg.content}</p>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : msg.time}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PlusSquare size={20} color="var(--text-secondary)" />
          </div>
          <input 
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px 16px', borderRadius: '24px', outline: 'none', fontSize: '1rem' }} 
            placeholder={`مراسلة ${otherUser.fullName || otherUser.name}...`} value={newMessage} onChange={e => setNewMessage(e.target.value)} 
          />
          <button type="submit" style={{ background: 'var(--primary-blue)', width: '44px', height: '44px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: newMessage ? 1 : 0.5 }}>
            <Send size={20} color="white" style={{ marginLeft: '-2px' }} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DMChatTab;
