import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ArrowRight, Quote } from 'lucide-react';

const QuotesView = ({ onBack }) => {
  const { quotes, fetchQuotes, addQuote } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ text: '', doctor: '', subject: '' });
  
  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);
  
  const handleAdd = async () => {
    if (!form.text.trim() || !form.doctor.trim()) return;
    await addQuote(form.text, form.doctor, form.subject);
    setForm({ text: '', doctor: '', subject: '' }); 
    setShowAdd(false);
  };
  
  const list = quotes.length > 0 ? quotes : [];
  
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ArrowRight size={32} color="white" onClick={onBack} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '4px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>حائط الاقتباسات</h2>
        </div>
        <button onClick={() => setShowAdd(s => !s)} style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid var(--primary-blue)', color: 'var(--primary-blue)', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>إضافة +</button>
      </header>
      {showAdd && (
        <div style={{ padding: '16px', background: 'rgba(30,41,59,0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '12px', outline: 'none' }} placeholder="الاقتباس..." value={form.text} onChange={e => setForm(f => ({...f, text: e.target.value}))} />
          <input style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '12px', outline: 'none' }} placeholder="اسم الدكتور" value={form.doctor} onChange={e => setForm(f => ({...f, doctor: e.target.value}))} />
          <input style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '12px', outline: 'none' }} placeholder="المادة (اختياري)" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} />
          <button onClick={handleAdd} style={{ background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>نشر</button>
        </div>
      )}
      <div style={{ padding: '24px 16px' }}>
        {list.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد اقتباسات بعد</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {list.map((q, idx) => (
            <div key={q._id} style={{ background: idx%2===0?'linear-gradient(135deg,#DBEAFE,#BFDBFE)':'linear-gradient(135deg,#FEF3C7,#FDE68A)', color: '#1E3A8A', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', transform: idx%2===0?'rotate(-1deg)':'rotate(1deg)' }}>
              <Quote size={32} color={idx%2===0?'#3B82F6':'#D97706'} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ fontSize: '1.3rem', fontWeight: 'bold', lineHeight: '1.6', marginBottom: '24px' }}>"{q.text}"</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed rgba(0,0,0,0.1)', paddingTop: '16px' }}>
                <div><span style={{ display: 'block', fontWeight: 'bold' }}>{q.doctor}</span><span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{q.subject}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotesView;
