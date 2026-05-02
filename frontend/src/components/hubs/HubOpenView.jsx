import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { ArrowRight, Menu, Hash, Mic, Send, MicOff, Video, Phone, Users } from 'lucide-react';
import api from '../../services/api';
const getTextChannelName = (ch) => typeof ch === 'string' ? ch : (ch?.name || 'مجهول');

const HubOpenView = ({ hub, onBack }) => {
  const { user } = useAuthStore();
  const { socket } = useAppStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState(hub.textChannels?.[0]?.name || 'عام');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceCall, setVoiceCall] = useState(null);
  const [typingData, setTypingData] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!hub._id || !activeChannel) return;
    
    setLoading(true);
    // 1. Join Socket Room
    if (socket) {
      socket.emit('hub:join', { hubId: hub._id, channelId: activeChannel });
    }

    // 2. Fetch Initial Messages from DB
    api.get(`/hubs/${hub._id}/messages/${activeChannel}`)
      .then(res => {
        if (Array.isArray(res.data)) setMessages(res.data);
      })
      .catch(err => console.error("Fetch error:", err))
      .finally(() => setLoading(false));

    // 3. Listen for Live Messages
    const handleNewMsg = (msg) => {
      if (msg.channelId === activeChannel && msg.hubId === hub._id) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTypingUpdate = ({ user: typingUser, isTyping }) => {
      if (isTyping && typingUser._id !== user._id) {
        setTypingData(typingUser);
      } else {
        setTypingData(null);
      }
    };

    if (socket) {
      socket.on('hub:messageReceived', handleNewMsg);
      socket.on('hub:typingUpdate', handleTypingUpdate);
    }
    
    return () => {
       if (socket) {
         socket.emit('hub:leave', { hubId: hub._id, channelId: activeChannel });
         socket.off('hub:messageReceived', handleNewMsg);
         socket.off('hub:typingUpdate', handleTypingUpdate);
       }
    };
  }, [hub._id, activeChannel, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket) return;
    socket.emit('hub:typing', { hubId: hub._id, channelId: activeChannel, user });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    try {
      // 1. Save to Database
      const res = await api.post(`/hubs/${hub._id}/messages`, {
        channelId: activeChannel,
        text: newMessage
      });

      // 2. Broadcast via Socket
      if (socket) {
        socket.emit('hub:newMessage', res.data);
      }

      // 3. Update Local UI
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  const handleJoinVoice = (ch) => {
    setVoiceCall({
      channelName: getTextChannelName(ch),
      participants: [user],
      isMicOn: true,
      isCamOn: false
    });
  };

  if (voiceCall) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0F172A', zIndex: 1000, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-out' }}>
        <header style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ background: '#10B981', padding: '8px', borderRadius: '12px' }}>
                <Mic size={24} color="white" />
             </div>
             <div>
               <h2 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{hub.name}</h2>
               <p style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 'bold' }}>• Voice Connected: {voiceCall.channelName}</p>
             </div>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '16px' }}>
             <Users size={20} color="var(--text-secondary)" />
             <span style={{ color: 'white', fontWeight: 'bold' }}>{voiceCall.participants.length}</span>
           </div>
        </header>

        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: '24px', padding: '40px 24px', overflowY: 'auto' }}>
           {voiceCall.participants.map(p => (
             <div key={p._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'var(--surface-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #10B981', position: 'relative', boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)', transition: 'all 0.3s' }}>
                  <img src={p.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  {!voiceCall.isMicOn && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                      <MicOff size={40} color="white" />
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', display: 'block' }}>{p.fullName || 'أنت'}</span>
                  <span style={{ color: '#10B981', fontSize: '0.8rem' }}>Speaking...</span>
                </div>
             </div>
           ))}
        </div>

        <div style={{ padding: '40px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', gap: '32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
           <div 
             onClick={() => setVoiceCall({...voiceCall, isMicOn: !voiceCall.isMicOn})} 
             style={{ width: '64px', height: '64px', borderRadius: '50%', background: voiceCall.isMicOn ? 'rgba(255,255,255,0.1)' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
           >
             {voiceCall.isMicOn ? <Mic size={28} color="white" /> : <MicOff size={28} color="white" />}
           </div>
           
           <div 
             onClick={() => setVoiceCall({...voiceCall, isCamOn: !voiceCall.isCamOn})} 
             style={{ width: '64px', height: '64px', borderRadius: '50%', background: voiceCall.isCamOn ? '#10B981' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
           >
             <Video size={28} color={voiceCall.isCamOn ? "white" : "rgba(255,255,255,0.5)"} />
           </div>

           <div 
             onClick={() => setVoiceCall(null)} 
             style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transform: 'rotate(135deg)', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)' }}
           >
             <Phone size={28} color="white" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-dark)', zIndex: 500, position: 'fixed', inset: 0 }}>
      {/* Sidebar */}
      <div style={{ 
        width: sidebarOpen ? '260px' : '0px', 
        background: 'rgba(15,23,42,0.98)', 
        transition: 'width 0.3s', 
        overflow: 'hidden', 
        borderRight: sidebarOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
           <h3 style={{ color: 'white', fontWeight: 'bold' }}>{hub.name}</h3>
        </div>
        <div style={{ flex: 1, padding: '16px 8px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>القنوات النصية</p>
          {(hub.textChannels || []).map(ch => {
            const chName = getTextChannelName(ch);
            return (
              <div key={chName} onClick={() => { setActiveChannel(chName); setSidebarOpen(false); }} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px', background: activeChannel === chName ? 'rgba(139,92,246,0.2)' : 'transparent', color: activeChannel === chName ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={18} /> {chName}
              </div>
            );
          })}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', margin: '24px 0 12px', textTransform: 'uppercase' }}>القنوات الصوتية</p>
          {(hub.voiceChannels || []).map(ch => {
            const chName = getTextChannelName(ch);
            return (
              <div key={chName} onClick={() => handleJoinVoice(ch)} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Mic size={18} /> {chName}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <ArrowRight size={28} color="white" onClick={onBack} style={{ cursor: 'pointer' }} />
          <Menu size={24} color="white" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ cursor: 'pointer' }} />
          <div>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>{hub.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>#{activeChannel}</p>
          </div>
        </header>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px' }}>
              <img src={m.sender?.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{m.sender?.fullName || 'User'}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{new Date(m.createdAt).toLocaleTimeString()}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '0 12px 12px 12px', marginTop: '4px' }}>{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '8px 16px', minHeight: '24px' }}>
          {typingData && typingData.userId !== user._id && (
            <p style={{ color: 'var(--primary-blue)', fontSize: '0.8rem', animation: 'pulse 1.5s infinite' }}>
              {typingData.fullName} يكتب الآن...
            </p>
          )}
        </div>

        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '8px 16px', alignItems: 'center' }}>
            <input 
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '12px', outline: 'none' }} 
              placeholder={`ارسل رسالة في #${activeChannel}...`} 
              value={newMessage} 
              onChange={handleTyping} 
              onKeyPress={e => e.key === 'Enter' && handleSend()} 
            />
            <button onClick={handleSend} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Send size={24} color={newMessage ? "var(--primary-blue)" : "var(--text-secondary)"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubOpenView;
