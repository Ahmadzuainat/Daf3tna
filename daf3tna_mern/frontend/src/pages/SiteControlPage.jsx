import React, { useState, useEffect } from 'react';
import { Settings, Shield, Lock, Power, Megaphone, Save, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const SiteControlPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      toast.success('تم حفظ التغييرات بنجاح');
    } catch (err) {
      toast.error('خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });

  if (loading) return <div style={{ color: 'white' }}>جاري التحميل...</div>;

  return (
    <div className="fade-in" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>التحكم في النظام</h1>
          <p style={{ color: '#94a3b8' }}>إدارة وضع الصيانة، صلاحيات التسجيل، والميزات العالمية.</p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}>
          <Save size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        
        {/* Maintenance Section */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', background: settings?.maintenanceMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(30, 41, 59, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <Power color={settings?.maintenanceMode ? '#ef4444' : '#94a3b8'} />
               <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>وضع الصيانة (Maintenance Mode)</h3>
            </div>
            <div onClick={() => toggle('maintenanceMode')} style={{ width: '50px', height: '26px', background: settings?.maintenanceMode ? '#ef4444' : '#333', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
               <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', right: settings?.maintenanceMode ? '27px' : '3px', transition: 'all 0.3s' }} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>نوع الصيانة:</label>
              <select 
                value={settings?.maintenanceType}
                onChange={(e) => setSettings({...settings, maintenanceType: e.target.value})}
                style={{ width: '100%', background: '#0a0f1c', border: '1px solid #333', borderRadius: '8px', padding: '10px', color: 'white' }}
              >
                <option value="soft">Soft (تنبيه فقط)</option>
                <option value="read-only">Read Only (للقراءة فقط)</option>
                <option value="lockdown">Lockdown (إغلاق كامل)</option>
                <option value="emergency">Emergency (حالة طوارئ)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>رسالة الصيانة:</label>
              <input 
                type="text" 
                value={settings?.maintenanceMessage}
                onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                style={{ width: '100%', background: '#0a0f1c', border: '1px solid #333', borderRadius: '8px', padding: '10px', color: 'white' }}
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>صلاحيات المنصة</h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {[
                { label: 'تفعيل التسجيل الجديد', key: 'registrationEnabled' },
                { label: 'تفعيل الرسائل الخاصة', key: 'messagesEnabled' },
                { label: 'تفعيل رفع الوسائط', key: 'uploadsEnabled' },
                { label: 'تفعيل القصص (Stories)', key: 'storiesEnabled' }
              ].map((item) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px' }}>
                  <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{item.label}</span>
                  <div onClick={() => toggle(item.key)} style={{ width: '40px', height: '22px', background: settings?.[item.key] ? '#3b82f6' : '#333', borderRadius: '11px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', right: settings?.[item.key] ? '21px' : '3px', transition: 'all 0.2s' }} />
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Global Announcement */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Megaphone size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>إعلان عالمي (Global Announcement)</h3>
           </div>
           <textarea 
             value={settings?.announcement?.text}
             onChange={(e) => setSettings({...settings, announcement: {...settings.announcement, text: e.target.value}})}
             placeholder="أدخل نص الإعلان الذي سيظهر لجميع المستخدمين..."
             style={{ width: '100%', height: '100px', background: '#0a0f1c', border: '1px solid #333', borderRadius: '12px', padding: '16px', color: 'white', resize: 'none', marginBottom: '16px' }}
           />
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="checkbox" 
                checked={settings?.announcement?.isActive}
                onChange={() => setSettings({...settings, announcement: {...settings.announcement, isActive: !settings.announcement.isActive}})}
              />
              <span style={{ color: '#94a3b8' }}>تفعيل الإعلان فوراً</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SiteControlPage;
