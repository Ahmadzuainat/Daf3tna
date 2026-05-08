import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowRight, Ghost, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ConfessionsView = ({ onBack }) => {
  const { user: me } = useAuthStore();
  const { confessions, fetchConfessions, addConfession, deleteConfession } = useAppStore();
  const [newConf, setNewConf] = useState('');
  const [sending, setSending] = useState(false);
  
  useEffect(() => { fetchConfessions(); }, [fetchConfessions]);
  
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاعتراف؟')) return;
    try {
      await deleteConfession(id);
      toast.success('تم الحذف بنجاح');
    } catch(e) { toast.error('فشل الحذف'); }
  };
  
  const handleSend = async () => {
    if (!newConf.trim() || sending) return;
    setSending(true);
    try { 
      await addConfession(newConf); 
      setNewConf(''); 
      toast.success('تم النشر بنجاح! 👻');
    } catch(e) { toast.error('حدث خطأ'); } 
    finally { setSending(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(217, 70, 239, 0.2)' }}>
        <ArrowRight size={32} color="#D946EF" onClick={onBack} style={{ cursor: 'pointer', background: 'rgba(217, 70, 239, 0.1)', borderRadius: '50%', padding: '4px' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#D946EF', textShadow: '0 0 10px rgba(217, 70, 239, 0.5)' }}>الغرفة السرية (المجهول)</h2>
      </header>

      <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        {confessions.map(c => (
          <div key={c._id} style={{ background: 'rgba(217, 70, 239, 0.05)', border: '1px solid rgba(217, 70, 239, 0.2)', borderRadius: '20px', padding: '20px', position: 'relative', animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D946EF', opacity: 0.8 }}>
                <Ghost size={20} /> <span style={{ fontWeight: 'bold', letterSpacing: '2px' }}>ANONYMOUS</span>
              </div>
              {(me?.role === 'superadmin' || me?.role === 'admin' || me?.role === 'moderator') && (
                <Trash2 
                  size={18} 
                  color="#EF4444" 
                  style={{ cursor: 'pointer', opacity: 0.6 }} 
                  onClick={() => handleDelete(c._id)}
                />
              )}
            </div>
            <p style={{ color: 'white', fontSize: '1.2rem', lineHeight: '1.6', textShadow: '0 0 2px rgba(255,255,255,0.5)' }}>{c.text}</p>
            <div style={{ textAlign: 'left', marginTop: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{new Date(c.createdAt).toLocaleString('ar-EG')}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(217, 70, 239, 0.2)' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '12px 20px', display: 'flex', alignItems: 'center', border: '1px solid rgba(217, 70, 239, 0.3)' }}>
          <Ghost size={24} color="var(--text-secondary)" style={{ marginRight: '16px' }} />
          <input 
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '1.1rem', outline: 'none' }} 
            placeholder="اكتب فضفضة أو رسالة سرية..." 
            value={newConf}
            onChange={e => setNewConf(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
          />
          <Send onClick={handleSend} size={24} color={newConf ? "#D946EF" : "var(--text-secondary)"} style={{ cursor: 'pointer', transition: 'color 0.2s' }} />
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '12px' }}>لن يعرف أحد هويتك أبداً. يتم تشفير المرسل.</p>
      </div>
    </div>
  );
};

export default ConfessionsView;
