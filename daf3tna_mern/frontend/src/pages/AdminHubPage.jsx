import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Layers, Flag, Shield, BarChart3, 
  Settings, History, Bell, ShieldCheck, Globe,
  ArrowRight, X
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminCategoryCard = ({ title, desc, icon: Icon, color, onClick, badge }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="glass-card"
    style={{ 
      padding: '20px', 
      borderRadius: '24px', 
      border: '1px solid rgba(255,255,255,0.05)', 
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      background: 'rgba(30, 41, 59, 0.4)',
      position: 'relative'
    }}
  >
    {badge && (
      <span style={{ 
        position: 'absolute', top: '16px', right: '16px', 
        background: '#ef4444', color: 'white', fontSize: '0.7rem', 
        padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' 
      }}>
        {badge}
      </span>
    )}
    <div style={{ 
      width: '48px', height: '48px', borderRadius: '16px', 
      background: `${color}15`, display: 'flex', alignItems: 'center', 
      justifyContent: 'center', color: color 
    }}>
      <Icon size={24} />
    </div>
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>{title}</h3>
      <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>{desc}</p>
    </div>
  </motion.div>
);

const AdminHubPage = () => {
  const navigate = useNavigate();

  const categories = [
    { id: 'users', title: 'إدارة المستخدمين', desc: 'التحكم في الحسابات، الرتب، والحظر.', icon: Users, color: '#3b82f6', path: '/admin/users' },
    { id: 'content', title: 'إدارة المحتوى', desc: 'مراجعة المنشورات والقصص والتعليقات.', icon: Layers, color: '#ec4899', path: '/admin/content' },
    { id: 'reports', title: 'مركز البلاغات', desc: 'معالجة شكاوى المستخدمين والمحتوى المسيء.', icon: Flag, color: '#ef4444', path: '/admin/reports', badge: '12' },
    { id: 'hubs', title: 'المجتمعات (Hubs)', desc: 'إدارة المجموعات والقنوات والقواعد.', icon: ShieldCheck, color: '#8b5cf6', path: '/admin/hubs' },
    { id: 'analytics', title: 'التحليلات', desc: 'إحصائيات المنصة والنمو والنشاط.', icon: BarChart3, color: '#10b981', path: '/admin/analytics' },
    { id: 'security', title: 'مركز الأمان', desc: 'إدارة الـ IPs وحماية النظام من الهجمات.', icon: Shield, color: '#f59e0b', path: '/admin/security' },
    { id: 'site', title: 'إعدادات المنصة', desc: 'وضع الصيانة، إغلاق التسجيل، والميزات.', icon: Settings, color: '#6366f1', path: '/admin/site' },
    { id: 'logs', title: 'سجلات العمليات', desc: 'تتبع كافة الإجراءات الإدارية المتخذة.', icon: History, color: '#94a3b8', path: '/admin/logs' },
  ];

  return (
    <div className="fade-in" style={{ padding: '24px 16px', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>مركز القيادة 🛡️</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>أهلاً بك في نظام إدارة "دفعتنا" المركزي.</p>
        </div>
        <div onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
           <X size={24} color="white" />
        </div>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '16px' 
      }}>
        {categories.map((cat) => (
          <AdminCategoryCard 
            key={cat.id}
            {...cat}
            onClick={() => navigate(cat.path)}
          />
        ))}
      </div>

      {/* Emergency Lockdown Shortcut */}
      <div className="glass-card" style={{ 
        marginTop: '24px', padding: '20px', borderRadius: '24px', 
        border: '1px solid rgba(239, 68, 68, 0.2)', 
        background: 'rgba(239, 68, 68, 0.05)',
        display: 'flex', alignItems: 'center', gap: '16px'
      }}>
         <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
            <Globe size={24} color="#ef4444" />
         </div>
         <div style={{ flex: 1 }}>
            <h4 style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>الإغلاق الطارئ (Emergency)</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>إغلاق المنصة فوراً عن الجميع عدا الإدارة.</p>
         </div>
         <button onClick={() => navigate('/admin/site')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.8rem' }}>إدارة</button>
      </div>
    </div>
  );
};

export default AdminHubPage;
