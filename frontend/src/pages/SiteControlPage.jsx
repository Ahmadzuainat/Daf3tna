import React, { useState, useEffect } from 'react';
import { Settings, Shield, Lock, Power, Megaphone, Save, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const SiteControlPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings');
      setSettings(data.data);
    } catch (err) {
      toast.error('فشل في جلب إعدادات الموقع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      toast.error('خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleBroadcast = async () => {
    if (!alertMessage.trim()) return toast.error('أدخل رسالة التنبيه');
    try {
      await api.post('/admin/broadcast-alert', { message: alertMessage, type: 'emergency' });
      toast.success('تم بث التنبيه لجميع المستخدمين');
      setAlertMessage('');
    } catch (err) {
      toast.error('فشل بث التنبيه');
    }
  };

  const handleForceLogout = async () => {
    if (!window.confirm('هل أنت متأكد؟ سيتم طرد جميع المستخدمين من الموقع فوراً!')) return;
    try {
      await api.post('/admin/force-logout-all');
      toast.success('تم إرسال أمر تسجيل الخروج للجميع');
    } catch (err) {
      toast.error('فشل العملية');
    }
  };

  const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });

  if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>جاري جلب لوحة القيادة...</div>;

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', paddingBottom: '60px' }}>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: 'rgba(30, 41, 59, 0.4)', padding: '32px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'white', letterSpacing: '-1px' }}>غرفة العمليات 📡</h1>
          <p style={{ color: '#94a3b8', marginTop: '4px' }}>تحكم كامل في مفاصل منصة دفعتنا.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <button onClick={handleForceLogout} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 20px', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
              طرد الجميع
           </button>
           <button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' }}>
              {saving ? 'جاري الحفظ...' : 'تحديث النظام'}
           </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Maintenance & Emergency Section */}
        <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '32px', borderRadius: '32px', border: `1px solid ${settings?.maintenanceMode ? '#ef444444' : 'rgba(255,255,255,0.05)'}`, background: settings?.maintenanceMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(30, 41, 59, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: settings?.maintenanceMode ? '#ef444422' : '#ffffff0a', borderRadius: '16px' }}>
                   <Power size={24} color={settings?.maintenanceMode ? '#ef4444' : '#94a3b8'} />
                </div>
                <div>
                   <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>وضع الصيانة والحماية</h3>
                   <p style={{ color: '#64748b', fontSize: '0.85rem' }}>التحكم في وصول المستخدمين العام للمنصة.</p>
                </div>
             </div>
             <div onClick={() => toggle('maintenanceMode')} style={{ width: '60px', height: '32px', background: settings?.maintenanceMode ? '#ef4444' : '#1e293b', borderRadius: '16px', position: 'relative', cursor: 'pointer', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: '24px', height: '24px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', right: settings?.maintenanceMode ? '33px' : '3px', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
             </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
             <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '10px' }}>المستوى الأمني:</label>
                <select 
                  value={settings?.maintenanceType}
                  onChange={(e) => setSettings({...settings, maintenanceType: e.target.value})}
                  style={{ width: '100%', background: '#0a0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none' }}
                >
                  <option value="soft">Soft (إشعار صيانة فقط)</option>
                  <option value="read-only">Read Only (تجميد العمليات)</option>
                  <option value="lockdown">Lockdown (منع الدخول تماماً)</option>
                  <option value="emergency">Emergency (إغلاق طارئ)</option>
                </select>
             </div>
             <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '10px' }}>الرسالة الموجهة للطلاب:</label>
                <input 
                  type="text" 
                  value={settings?.maintenanceMessage}
                  onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                  placeholder="مثال: المنصة تحت الصيانة الدورية..."
                  style={{ width: '100%', background: '#0a0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none' }}
                />
             </div>
          </div>
        </div>

        {/* Global Broadcast Box */}
        <div className="glass-card" style={{ padding: '32px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.4)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Megaphone size={22} color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>بث تنبيه عاجل</h3>
           </div>
           <textarea 
             value={alertMessage}
             onChange={(e) => setAlertMessage(e.target.value)}
             placeholder="اكتب رسالة ستظهر فوراً في شريط أحمر لجميع المستخدمين..."
             style={{ width: '100%', height: '100px', background: '#0a0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', color: 'white', resize: 'none', marginBottom: '16px', outline: 'none' }}
           />
           <button onClick={handleBroadcast} style={{ width: '100%', background: '#f59e0b', color: 'black', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              بث التنبيه الآن
           </button>
        </div>

        {/* Features Management */}
        <div className="glass-card" style={{ padding: '32px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.4)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Settings size={22} color="#3b82f6" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>إدارة ميزات المنصة</h3>
           </div>
           <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { label: 'التسجيل الجديد', key: 'registrationEnabled' },
                { label: 'الرسائل الخاصة (DM)', key: 'dmsEnabled' },
                { label: 'دردشة الـ Hubs', key: 'hubChatEnabled' },
                { label: 'القصص (Stories)', key: 'storiesEnabled' },
                { label: 'التعليقات', key: 'commentsEnabled' },
                { label: 'رفع الملفات والوسائط', key: 'uploadsEnabled' },
                { label: 'الدفاتر الخاصة (Notebooks)', key: 'notebooksEnabled' }
              ].map((item) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '14px' }}>
                   <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '500' }}>{item.label}</span>
                   <div onClick={() => toggle(item.key)} style={{ width: '44px', height: '24px', background: settings?.[item.key] ? '#10b981' : '#334155', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}>
                      <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', right: settings?.[item.key] ? '23px' : '3px', transition: '0.2s' }} />
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default SiteControlPage;
