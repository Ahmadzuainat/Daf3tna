import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, Edit, Hash, Mic, Save, X } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const AdminHubsPage = () => {
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHub, setEditingHub] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '', textChannels: ['عام'], voiceChannels: ['صوتي'] });

  const fetchHubs = async () => {
    try {
      const { data } = await api.get('/hubs');
      setHubs(data);
    } catch (err) {
      toast.error('فشل في جلب المجتمعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHub) {
        await api.put(`/admin/hubs/${editingHub._id}`, formData);
        toast.success('تم تحديث المجتمع بنجاح');
      } else {
        await api.post('/admin/hubs', formData);
        toast.success('تم إنشاء المجتمع بنجاح');
      }
      setShowModal(false);
      fetchHubs();
    } catch (err) {
      toast.error('خطأ في العملية');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المجتمع نهائياً؟')) return;
    try {
      await api.delete(`/admin/hubs/${id}`);
      toast.success('تم الحذف بنجاح');
      fetchHubs();
    } catch (err) {
      toast.error('فشل في الحذف');
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '40px' }}>جاري التحميل...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>إدارة المجتمعات (Hubs)</h1>
          <p style={{ color: '#94a3b8' }}>إنشاء وتعديل غرف المحادثات والقنوات لكل دفعة.</p>
        </div>
        <button 
          onClick={() => { setEditingHub(null); setFormData({ name: '', description: '', icon: '', textChannels: ['عام'], voiceChannels: ['صوتي'] }); setShowModal(true); }}
          style={{ background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> إضافة مجتمع
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {hubs.map((hub) => (
          <div key={hub._id} className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
               <div style={{ width: '50px', height: '50px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {hub.icon || '🏢'}
               </div>
               <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditingHub(hub); setFormData(hub); setShowModal(true); }} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}><Edit size={16} /></button>
                  <button onClick={() => handleDelete(hub._id)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
               </div>
            </div>
            <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>{hub.name}</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>{hub.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
               {hub.textChannels?.map(ch => (
                 <span key={ch.name || ch} style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <Hash size={12} /> {ch.name || ch}
                 </span>
               ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#0f172a', width: '100%', maxWidth: '500px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h2 style={{ color: 'white', fontWeight: 'bold' }}>{editingHub ? 'تعديل المجتمع' : 'إنشاء مجتمع جديد'}</h2>
                 <X size={24} color="#64748b" onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px' }}>
                    <div>
                       <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '8px' }}>أيقونة:</label>
                       <input type="text" value={formData.icon} onChange={(e) => setFormData({...formData, icon: e.target.value})} placeholder="🏢" style={{ width: '100%', background: '#0a0f1c', border: '1px solid #333', borderRadius: '12px', padding: '12px', textAlign: 'center', fontSize: '1.2rem' }} />
                    </div>
                    <div>
                       <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '8px' }}>اسم المجتمع:</label>
                       <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', background: '#0a0f1c', border: '1px solid #333', borderRadius: '12px', padding: '12px', color: 'white' }} />
                    </div>
                 </div>
                 <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '8px' }}>الوصف:</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', height: '80px', background: '#0a0f1c', border: '1px solid #333', borderRadius: '12px', padding: '12px', color: 'white', resize: 'none' }} />
                 </div>
                 <button type="submit" style={{ width: '100%', background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>حفظ البيانات</button>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminHubsPage;
