import React, { useState, useEffect } from 'react';
import { ShieldAlert, UserX, Plus, Trash2, Globe, Clock, Shield } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const SecurityPage = () => {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBan, setNewBan] = useState({ ip: '', reason: '', duration: 'permanent' });

  const fetchBans = async () => {
    try {
      const { data } = await api.get('/admin/security/bans');
      setBans(data.data);
    } catch (err) {
      toast.error('فشل في جلب قائمة المحظورين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBans();
  }, []);

  const handleBan = async (e) => {
    e.preventDefault();
    if (!newBan.ip || !newBan.reason) return toast.error('يرجى ملء جميع الحقول');
    
    try {
      await api.post('/admin/security/ban-ip', newBan);
      toast.success('تم حظر IP بنجاح');
      setNewBan({ ip: '', reason: '', duration: 'permanent' });
      fetchBans();
    } catch (err) {
      toast.error('خطأ في عملية الحظر');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>أمان الشبكة</h1>
          <p style={{ color: '#94a3b8' }}>إدارة حظر الـ IP، مكافحة السبام، وحماية النظام.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Add Ban Form */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} color="#ef4444" /> حظر IP جديد
          </h3>
          <form onSubmit={handleBan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>عنوان IP:</label>
              <input 
                type="text" 
                placeholder="مثال: 192.168.1.1"
                value={newBan.ip}
                onChange={(e) => setNewBan({...newBan, ip: e.target.value})}
                style={{ width: '100%', background: '#0a0f1c', border: '1px solid #333', borderRadius: '8px', padding: '10px', color: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>السبب:</label>
              <input 
                type="text" 
                placeholder="محاولة اختراق، سبام..."
                value={newBan.reason}
                onChange={(e) => setNewBan({...newBan, reason: e.target.value})}
                style={{ width: '100%', background: '#0a0f1c', border: '1px solid #333', borderRadius: '8px', padding: '10px', color: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>المدة:</label>
              <select 
                value={newBan.duration}
                onChange={(e) => setNewBan({...newBan, duration: e.target.value})}
                style={{ width: '100%', background: '#0a0f1c', border: '1px solid #333', borderRadius: '8px', padding: '10px', color: 'white' }}
              >
                <option value="permanent">دائم</option>
                <option value="24h">24 ساعة</option>
                <option value="7d">أسبوع</option>
              </select>
            </div>
            <button type="submit" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              تأكيد الحظر
            </button>
          </form>
        </div>

        {/* Active Bans Table */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={20} color="#3b82f6" /> قائمة الـ IPs المحظورة
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid #333' }}>
                <th style={{ padding: '12px' }}>العنوان IP</th>
                <th style={{ padding: '12px' }}>السبب</th>
                <th style={{ padding: '12px' }}>تاريخ الحظر</th>
                <th style={{ padding: '12px' }}>بواسطة</th>
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => (
                <tr key={ban._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#cbd5e1' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 'bold', color: '#ef4444' }}>{ban.value}</td>
                  <td style={{ padding: '16px 12px', fontSize: '0.85rem' }}>{ban.reason}</td>
                  <td style={{ padding: '16px 12px', fontSize: '0.85rem' }}>{new Date(ban.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 12px', fontSize: '0.85rem' }}>{ban.bannedBy?.fullName || 'النظام'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bans.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>القائمة فارغة حالياً.</div>}
        </div>

      </div>
    </div>
  );
};

export default SecurityPage;
