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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!hub._id || !activeChannel) return;
    
    // Join room
    const room = `${hub._id}-${activeChannel}`;
    if (socket) {
      socket.emit('join_room', room);
    }

    // Fetch messages
    api.get(`/hubs/${hub._id}/channels/${activeChannel}/messages`)
      .then(res => {
        if (Array.isArray(res.data)) setMessages(res.data);
      })
      .catch(err => console.error("Fetch error:", err));

    const handleNewMsg = (msg) => {
      if (String(msg.channelName) === String(activeChannel) && String(msg.hubId) === String(hub._id)) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    if (socket) {
      socket.on('receive_message', handleNewMsg);
    }
    
    return () => {
       if (socket) {
         socket.off('receive_message', handleNewMsg);
       }
    };
  }, [hub._id, activeChannel, socket, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [voiceCall, setVoiceCall] = useState(null);

  const handleJoinVoice = (ch) => {
     const chName = getTextChannelName(ch);
     setVoiceCall({ channelName: chName, participants: [user], isMicOn: true, isCamOn: false });
  };

  const { typingStatus } = useAppStore(); 
  const typingRoom = `${hub._id}-${activeChannel}`;
  const typingData = typingStatus[typingRoom];

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket) return;
    socket.emit('typing', { room: typingRoom, userId: user._id, fullName: user.fullName });
    
    if (window.typingTimeout) clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit('stop_typing', { room: typingRoom });
    }, 2000);
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    if (!socket) return;
    const msgData = { content: newMessage, sender: user._id, hubId: hub._id, channelName: activeChannel };
    socket.emit('send_message', msgData);
    socket.emit('stop_typing', { room: typingRoom });
    setNewMessage('');
    setMessages(prev => [...prev, { ...msgData, sender: user, createdAt: new Date() }]);
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
                <p style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '0 12px 12px 12px', marginTop: '4px' }}>{m.content}</p>
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
