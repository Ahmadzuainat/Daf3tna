import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { ArrowRight, Moon, Sun, Crown, Check, Lock, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const SettingsTab = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUser } = useAuthStore();
  const { updateProfile } = useAppStore();
  const [settings, setSettings] = useState({
    theme: user?.theme || 'dark',
    language: user?.language || 'ar',
    isPrivate: user?.isPrivate || false
  });

  const handleSave = async () => {
    try {
      const res = await updateProfile(settings);
      if (res.success) {
        updateUser(res.data);
        toast.success('تم حفظ الإعدادات');
        // Apply immediately
        document.body.setAttribute('data-theme', settings.theme);
        i18n.changeLanguage(settings.language);
        document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
        onBack();
      }
    } catch (err) {
      toast.error('فشل حفظ الإعدادات');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>
       <header style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div onClick={onBack} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '8px' }}>
             <ArrowRight size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>{t('settings')}</h2>
          <button 
            onClick={handleSave} 
            style={{ 
              marginRight: 'auto', background: 'var(--primary-blue)', color: 'white', 
              border: 'none', padding: '8px 20px', borderRadius: '12px', 
              fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' 
            }}
          >
            {t('save')}
          </button>
       </header>

       <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section>
             <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase' }}>{t('appearance')}</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { id: 'dark', name: t('theme_dark'), icon: Moon, color: '#111827' },
                  { id: 'light', name: t('theme_light'), icon: Sun, color: '#F8FAFC' },
                  { id: 'premium', name: t('theme_premium'), icon: Crown, color: '#1E1B4B' }
                ].map(theme => (
                  <div 
                    key={theme.id}
                    onClick={() => setSettings({ ...settings, theme: theme.id })}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '16px', borderRadius: '16px', cursor: 'pointer',
                      background: settings.theme === theme.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                      border: settings.theme === theme.id ? '1px solid var(--primary-blue)' : '1px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ background: theme.color, padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <theme.icon size={20} color={theme.id === 'light' ? '#333' : 'white'} />
                       </div>
                       <span style={{ color: 'white', fontWeight: 'bold' }}>{theme.name}</span>
                    </div>
                    {settings.theme === theme.id && <Check size={20} color="var(--primary-blue)" />}
                  </div>
                ))}
             </div>
          </section>

          <section>
             <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase' }}>{t('language')}</h3>
             <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { id: 'ar', name: 'العربية', flag: '🇸🇦' },
                  { id: 'en', name: 'English', flag: '🇺🇸' }
                ].map(lang => (
                  <div 
                    key={lang.id}
                    onClick={() => setSettings({ ...settings, language: lang.id })}
                    style={{ 
                      flex: 1, padding: '16px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center',
                      background: settings.language === lang.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                      border: settings.language === lang.id ? '1px solid var(--primary-blue)' : '1px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '4px' }}>{lang.flag}</span>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>{lang.name}</span>
                  </div>
                ))}
             </div>
          </section>

          <section>
             <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase' }}>{t('privacy_safety')}</h3>
             <div 
                onClick={() => setSettings({ ...settings, isPrivate: !settings.isPrivate })}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '20px', borderRadius: '20px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'
                }}
             >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
                      <Lock size={22} color="#10B981" />
                   </div>
                   <div>
                      <span style={{ color: 'white', fontWeight: 'bold', display: 'block' }}>{t('private_account')}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t('private_account_desc')}</span>
                   </div>
                </div>
                <div style={{ 
                  width: '48px', height: '26px', borderRadius: '13px', 
                  background: settings.isPrivate ? '#10B981' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.3s'
                }}>
                   <div style={{ 
                     position: 'absolute', top: '3px', 
                     left: settings.isPrivate ? '25px' : '3px',
                     width: '20px', height: '20px', background: 'white', 
                     borderRadius: '50%', transition: 'all 0.3s'
                   }} />
                </div>
             </div>
          </section>

          <button 
            onClick={logout}
            style={{ 
              marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              padding: '18px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', 
              color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', 
              fontWeight: 'bold', cursor: 'pointer' 
            }}
          >
            <LogOut size={20} /> {t('logout')}
          </button>
       </div>
    </div>
  );
};

export default SettingsTab;
