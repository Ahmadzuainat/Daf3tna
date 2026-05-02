import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ArrowRight, Lock, PlusSquare, Check } from 'lucide-react';
import { toast } from 'sonner';

const TimeCapsuleView = ({ onBack }) => {
  const { timeCapsules, fetchTimeCapsules, createTimeCapsule } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [text, setText] = useState('');
  
  // Set default unlock date to 2 months from now
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() + 2);
  const [unlockDate, setUnlockDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [isPublic, setIsPublic] = useState(true);

  // Countdown logic
  const [timeLeft, setTimeLeft] = useState({ months: 2, days: 0, hours: 0, seconds: 0 });

  useEffect(() => {
    fetchTimeCapsules();
    
    const target = new Date('2026-07-01T00:00:00');

    const timer = setInterval(() => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ months: 0, days: 0, hours: 0, seconds: 0 });
        return;
      }

      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44)); // Average month length
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ months, days, hours, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchTimeCapsules]);

  const handleCreate = async () => {
    if (!text.trim()) return;
    try {
      await createTimeCapsule({ text, unlockDate, isPublic });
      setShowAdd(false);
      setText('');
      fetchTimeCapsules();
      toast.success('تم إيداع رسالتك في الكبسولة بنجاح! 🔒');
    } catch (err) {
      toast.error('خطأ في إيداع الرسالة. حاول مرة أخرى.');
    }
  };

  const locked = timeCapsules.filter(c => new Date(c.unlockDate) > new Date());

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #064E3B 0%, var(--bg-dark) 100%)', display: 'flex', flexDirection: 'column', width: '100%', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
          <ArrowRight size={32} color="white" onClick={onBack} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '4px' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>الكبسولة الزمنية</h2>
        </header>

      {showAdd ? (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(16, 185, 129, 0.3)', animation: 'fadeInUp 0.3s ease-out' }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>أودع رسالة للمستقبل ⏳</h3>
          <textarea 
            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: 'white', fontSize: '1.1rem', minHeight: '120px', outline: 'none', marginBottom: '16px' }} 
            placeholder="اكتب رسالتك هنا... لن يراها أحد حتى موعد الفتح." 
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>موعد الفتح</label>
            <input type="date" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }} value={unlockDate} onChange={e => setUnlockDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <input type="checkbox" id="isPublic" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
            <label htmlFor="isPublic" style={{ color: 'white' }}>اجعلها علنية للدفعة بعد الفتح</label>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleCreate} style={{ flex: 1, background: '#10B981', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold' }}>تأكيد الإيداع 🔒</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px' }}>إلغاء</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Lock size={80} color="#10B981" style={{ marginBottom: '16px', filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.4))' }} />
            <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '12px' }}>الكبسولة الزمنية</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
              تم إغلاق الكبسولة آلياً ولن تفتح إلا في يوم حفل التخرج لدفعة 2026.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '80px' }}>
             {[
               { val: 0, label: 'سنة' },
               { val: timeLeft.months, label: 'أشهر' },
               { val: timeLeft.days, label: 'يوم' },
               { val: timeLeft.hours, label: 'ساعة' }
             ].map((t, i) => (
               <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '80px', height: '100px', background: 'rgba(6, 78, 59, 0.6)', border: '2px solid #10B981', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: '#10B981', boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)' }}>
                    {String(t.val).padStart(2, '0')}
                  </div>
                  <span style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold', opacity: 0.8 }}>{t.label}</span>
               </div>
             ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '80px' }}>
             <button onClick={() => setShowAdd(true)} style={{ background: 'var(--primary-blue)', border: 'none', color: 'white', padding: '18px 48px', borderRadius: '40px', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <PlusSquare size={24} color="white" /> إيداع رسالة جديدة للمستقبل ⏳
             </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ color: '#10B981', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '8px' }}>رسائلك المودعة ({locked.length})</h3>
            {locked.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>لم تقم بإيداع أي رسائل بعد.</p>}
            {locked.map(c => (
              <div key={c._id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>فتح بتاريخ: {new Date(c.unlockDate).toLocaleDateString('ar-EG')}</span>
                  {new Date(c.unlockDate) > new Date() ? <Lock size={14} color="#F59E0B" /> : <Check size={14} color="#10B981" />}
                </div>
                <p style={{ color: new Date(c.unlockDate) > new Date() ? 'rgba(255,255,255,0.4)' : 'white', fontStyle: new Date(c.unlockDate) > new Date() ? 'italic' : 'normal' }}>
                  {new Date(c.unlockDate) > new Date() ? 'محتوى مشفر ومخفي...' : c.text}
                </p>
              </div>
            ))}
          </div>

        </>
      )}
      </div>
    </div>
  );
};

export default TimeCapsuleView;
