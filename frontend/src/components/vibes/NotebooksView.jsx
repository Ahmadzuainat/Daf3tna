import React, { useState, useEffect } from 'react';
import { ArrowRight, Book, Pin, Trash2, Edit3, Check, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const NotebooksView = ({ onBack }) => {
  const { notebooks, fetchNotebooks, addNotebookMessage, deleteNotebookMessage, createNotebook, updateNotebook, deleteNotebook } = useAppStore();
  const { user } = useAuthStore();
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [signText, setSignText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form States
  const [form, setForm] = useState({
    title: '',
    description: '',
    quote: '',
    color: '#1e3a8a',
    isPublic: true
  });

  const COLORS = ['#0a192f', '#b45309', '#065f46', '#9d174d', '#6d28d9', '#1e3a8a'];

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  useEffect(() => {
    const myNb = notebooks.find(nb => nb.owner?._id === user?._id);
    if (myNb) {
      setForm({
        title: myNb.title || '',
        description: myNb.description || '',
        quote: myNb.quote || '',
        color: myNb.color || '#1e3a8a',
        isPublic: myNb.isPublic !== false
      });
    }
  }, [notebooks, user]);

  const handleSign = async () => {
    if (!signText.trim()) return;
    try {
      const updatedNb = await addNotebookMessage(selectedNotebook._id, signText);
      setSignText('');
      toast.success('تم التوقيع بنجاح! ✍️');
      // Update local state immediately with returned data
      setSelectedNotebook(updatedNb);
      fetchNotebooks(); // keep background grid updated
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل في إرسال الرسالة';
      toast.error(msg);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const myNb = notebooks.find(nb => nb.owner?._id === user?._id);
      if (myNb) {
        await updateNotebook(myNb._id, form);
      } else {
        await createNotebook({ ...form, batchId: user.batchId });
      }
      setIsSettingsOpen(false);
      toast.success('تم حفظ إعدادات الدفتر! ✨');
      fetchNotebooks();
    } catch (err) {
      toast.error('فشل في حفظ الإعدادات');
    }
  };

  const handleDeleteNotebook = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذا الدفتر بالكامل؟')) return;
    try {
      await deleteNotebook(id);
      toast.success('تم حذف الدفتر بنجاح');
    } catch(e) { toast.error('فشل حذف الدفتر'); }
  };

  const handleDeleteMessage = async (notebookId, msgId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    try {
      await deleteNotebookMessage(notebookId, msgId);
      toast.success('تم حذف الرسالة');
      // Update local state immediately if detail view is open
      if (selectedNotebook) {
        setSelectedNotebook({ 
          ...selectedNotebook, 
          messages: selectedNotebook.messages.filter(m => m._id !== msgId) 
        });
      }
      fetchNotebooks(); 
    } catch(e) { toast.error('فشل حذف الرسالة'); }
  };

  // 1. DETAIL VIEW
  if (selectedNotebook) {
    const isOwner = selectedNotebook.owner?._id === user?._id;
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1c', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <ArrowRight size={28} color="white" onClick={() => setSelectedNotebook(null)} style={{ cursor: 'pointer' }} />
          <div style={{ textAlign: 'center' }}>
             <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '-2px' }}>بواسطة {selectedNotebook.owner?.fullName}</p>
             <h2 style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>{selectedNotebook.title || 'دفتر التخرج'}</h2>
          </div>
          <div style={{ width: '28px' }} />
        </header>

        <div style={{ flex: 1, padding: '24px 16px', overflowY: 'auto' }}>
           {/* Profile Hero Card */}
           <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '24px', padding: '40px 20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: selectedNotebook.color || '#9333ea' }} />
              
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: `3px solid ${selectedNotebook.color || '#9333ea'}`, margin: '0 auto 20px', padding: '3px' }}>
                 <img src={selectedNotebook.owner?.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
              
              <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '8px' }}>{selectedNotebook.owner?.fullName}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '24px' }}>{selectedNotebook.description || 'IT • دفعة 2026'}</p>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', display: 'inline-block', minWidth: '120px' }}>
                 <p style={{ color: 'white', fontSize: '1.1rem', fontStyle: 'italic' }}>"{selectedNotebook.quote || 'لا يوجد اقتباس بعد'}"</p>
              </div>
           </div>

           {/* Messages Section */}
           <div style={{ marginBottom: '120px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                 <Book size={20} color={selectedNotebook.color || "#9333ea"} />
                 <h4 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>رسائل الزملاء</h4>
                 <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{selectedNotebook.messages?.length || 0} رسالة</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {selectedNotebook.messages?.map((msg, idx) => (
                    <div key={idx} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', justifyContent: 'flex-end' }}>
                          {(isOwner || user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'moderator') && (
                            <button 
                              onClick={() => handleDeleteMessage(selectedNotebook._id, msg._id)}
                              style={{ position: 'absolute', left: '16px', top: '16px', background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.5)', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <div style={{ textAlign: 'right' }}>
                             <span style={{ fontWeight: 'bold', color: 'white', display: 'block', fontSize: '0.9rem' }}>{msg.author?.fullName}</span>
                             <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{new Date(msg.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                          <img src={msg.author?.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                       </div>
                       <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', textAlign: 'right', fontSize: '1rem' }}>{msg.text}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {!isOwner && (
          <div style={{ position: 'fixed', bottom: '24px', left: '16px', right: '16px', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '12px 16px', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
             <input style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px', color: 'white', outline: 'none', fontSize: '1rem', textAlign: 'right' }} placeholder="اترك كلمة للذكرى..." value={signText} onChange={e => setSignText(e.target.value)} />
             <button onClick={handleSign} style={{ background: selectedNotebook.color || 'linear-gradient(90deg, #9333ea, #3b82f6)', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={20} />
             </button>
          </div>
        )}
      </div>
    );
  }

  // 2. GRID VIEW
  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1c', padding: '24px 16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <header style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', textAlign: 'right' }}>
        <div style={{ width: '32px' }} />
        <div style={{ flex: 1 }}>
           <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>كتاب التخرج (Yearbook)</h2>
           <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>اترك ذكرى لزملائك واقرأ ما كتبوه لك</p>
        </div>
        <ArrowRight size={32} color="white" onClick={onBack} style={{ cursor: 'pointer' }} />
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '30px', paddingBottom: '120px', direction: 'rtl' }}>
        {notebooks.filter(nb => nb.isPublic).map(nb => (
          <div key={nb._id} onClick={() => setSelectedNotebook(nb)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
             <div style={{ width: '100px', height: '140px', background: nb.color || '#9333ea', borderRadius: '4px 12px 12px 4px', boxShadow: '0 15px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderLeft: '3px solid rgba(255,255,255,0.1)' }}>
                {(user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'moderator') && (
                  <button 
                    onClick={(e) => handleDeleteNotebook(e, nb._id)}
                    style={{ position: 'absolute', top: '-10px', left: '-10px', background: '#EF4444', border: 'none', padding: '6px', borderRadius: '50%', color: 'white', cursor: 'pointer', zIndex: 5, boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid white', overflow: 'hidden', background: '#111' }}>
                   <img src={nb.owner?.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
             </div>
             <h4 style={{ color: 'white', fontWeight: 'bold', marginTop: '12px', fontSize: '0.95rem', textAlign: 'center' }}>{nb.owner?.fullName}</h4>
             <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{nb.title || 'IT'}</p>
          </div>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: '24px', left: '16px', right: '16px', zIndex: 10 }}>
         <button 
           onClick={() => setIsSettingsOpen(true)}
           style={{ width: '100%', background: 'linear-gradient(90deg, #9333ea, #3b82f6)', border: 'none', padding: '16px', borderRadius: '50px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
         >
           <Edit3 size={20} />
           افتح دفتري الخاص
         </button>
      </div>

      {/* SETTINGS MODAL (IMAGE STYLE) */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#111827', width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '32px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
              <X size={24} color="white" style={{ position: 'absolute', top: '24px', right: '24px', cursor: 'pointer' }} onClick={() => setIsSettingsOpen(false)} />
              
              <div style={{ textAlign: 'right', marginBottom: '32px' }}>
                 <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>إعدادات الدفتر</h3>
                 <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>خصص مظهر دفترك ومحتواه</p>
              </div>

              <div style={{ display: 'flex', gap: '24px', direction: 'rtl' }}>
                 {/* Left: Inputs */}
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                       <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>العنوان</label>
                       <input style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="مثلاً: دفتر ذكرياتي" />
                    </div>
                    <div>
                       <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>الوصف</label>
                       <textarea style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none', height: '80px', resize: 'none' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="تكلم عن نفسك..." />
                    </div>
                    <div>
                       <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>اقتباسك الخاص</label>
                       <input style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} value={form.quote} onChange={e => setForm({...form, quote: e.target.value})} placeholder="حكمة تؤمن بها..." />
                    </div>
                 </div>

                 {/* Right: Live Preview */}
                 <div style={{ width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div animate={{ rotateY: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 3 }} style={{ width: '80px', height: '110px', background: form.color, borderRadius: '4px 12px 12px 4px', boxShadow: `0 20px 40px ${form.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '4px solid rgba(255,255,255,0.2)' }}>
                       <div style={{ width: '35px', height: '35px', borderRadius: '50%', border: '2px solid white', overflow: 'hidden' }}>
                          <img src={user?.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       </div>
                    </motion.div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: '12px' }}>معاينة مباشرة</p>
                 </div>
              </div>

              <div style={{ marginTop: '32px', textAlign: 'right' }}>
                 <label style={{ color: 'white', display: 'block', marginBottom: '16px', fontSize: '0.9rem' }}>لون الغلاف</label>
                 <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    {COLORS.map(c => (
                      <div key={c} onClick={() => setForm({...form, color: c})} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : 'none', cursor: 'pointer', transition: '0.2s transform' }} />
                    ))}
                 </div>
              </div>

              <div style={{ marginTop: '32px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' }}>
                 <div>
                    <h4 style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>ظهور عام</h4>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>سيتمكن الجميع من رؤية دفترك في المعرض</p>
                 </div>
                 <input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }} />
              </div>

              <button onClick={handleSaveSettings} style={{ width: '100%', background: 'linear-gradient(90deg, #3b82f6, #2563eb)', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '32px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' }}>
                 حفظ التعديلات ✨
              </button>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default NotebooksView;
