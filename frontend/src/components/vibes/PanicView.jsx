import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowRight, Trash2, Zap, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

const PanicView = ({ onBack }) => {
  const { panics, fetchPanics, createPanic, deletePanic, replyPanic } = useAppStore();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [panicText, setPanicText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});

  useEffect(() => { fetchPanics(); }, [fetchPanics]);

  const handleCreate = async () => {
    if (!panicText.trim()) return;
    try {
      await createPanic(panicText);
      setPanicText('');
      setShowCreate(false);
      toast.success('تم إرسال الفزعة بنجاح! 🚀');
    } catch(err) { toast.error('خطأ في إرسال الفزعة'); }
  };

  const handleReply = async (panicId) => {
    const text = replyTexts[panicId];
    if (!text?.trim()) return;
    try {
      await replyPanic(panicId, text);
      setReplyTexts({ ...replyTexts, [panicId]: '' });
      toast.success('تم إرسال ردك بنجاح');
    } catch(err) { toast.error('خطأ في إرسال الرد'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1 }}>

      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(15px)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <ArrowRight size={28} color="white" onClick={onBack} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '4px' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>ساحة الفزعة (Panics)</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>زملائك دائماً بجانبك في الأوقات الصعبة</p>
        </div>
      </header>

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '140px' }}>
        {panics.length > 0 ? panics.map(panic => (
          <div key={panic._id} style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '24px', padding: '24px', position: 'relative', animation: 'fadeInUp 0.3s' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <img src={panic.author?.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #EF4444' }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{panic.author?.fullName}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(panic.createdAt).toLocaleString('ar-EG')}</p>
              </div>
              {panic.author?._id === user?._id && (
                <button onClick={() => deletePanic(panic._id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}>
                  <Trash2 size={20} />
                </button>
              )}
            </div>
            
            <p style={{ color: 'white', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>{panic.text}</p>
            
            {/* Replies Section */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <h5 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>الردود والمساعدات ({panic.replies?.length || 0})</h5>
               
               {panic.replies?.map((reply, ridx) => (
                 <div key={ridx} style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                    <img src={reply.user?.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                       <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', display: 'block' }}>{reply.user?.fullName}</span>
                       <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>{reply.text}</p>
                    </div>
                 </div>
               ))}

               <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input 
                    placeholder="اكتب ردك أو مساعدتك..." 
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: '12px', padding: '10px 16px', color: 'white', outline: 'none' }}
                    value={replyTexts[panic._id] || ''}
                    onChange={e => setReplyTexts({ ...replyTexts, [panic._id]: e.target.value })}
                  />
                  <button onClick={() => handleReply(panic._id)} style={{ background: '#EF4444', border: 'none', borderRadius: '12px', padding: '0 16px', color: 'white', cursor: 'pointer' }}>إرسال</button>
               </div>
            </div>
          </div>
        )) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.5 }}>
             <AlertCircle size={80} color="#EF4444" style={{ marginBottom: '16px' }} />
             <p style={{ fontSize: '1.2rem' }}>لا توجد طلبات فزعة حالياً.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div style={{ position: 'fixed', bottom: '24px', left: '0', right: '0', zIndex: 50, display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
         <button onClick={() => setShowCreate(true)} style={{ width: '100%', maxWidth: '500px', background: 'linear-gradient(135deg, #EF4444, #B91C1C)', color: 'white', border: 'none', padding: '16px 24px', borderRadius: '32px', fontSize: '1.2rem', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <Zap size={24} /> اطلب فزعة الآن! 🔥
         </button>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
           <div style={{ background: 'var(--surface-dark)', width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '32px', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 20px 50px rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>ما هي مشكلتك؟</h3>
                 <X onClick={() => setShowCreate(false)} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
              </div>
              <textarea 
                placeholder="مثلاً: حدا معو شاحن ايفون بالبوابة الشمالية؟" 
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: '20px', padding: '20px', color: 'white', minHeight: '150px', outline: 'none', resize: 'none', fontSize: '1.1rem', marginBottom: '24px' }}
                value={panicText}
                onChange={e => setPanicText(e.target.value)}
              />
              <button onClick={handleCreate} style={{ width: '100%', background: '#EF4444', color: 'white', border: 'none', padding: '18px', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>نشر الفزعة 🚀</button>
           </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PanicView;
