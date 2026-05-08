import React from 'react';
import { ChevronLeft, Flame, Zap, Book, AlertTriangle, Crown, Quote, Ghost, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

// Import sub-views
import PanicView from '../vibes/PanicView';
import AwardsView from '../vibes/AwardsView';
import QuotesView from '../vibes/QuotesView';
import ConfessionsView from '../vibes/ConfessionsView';
import TimeCapsuleView from '../vibes/TimeCapsuleView';
import InstantsView from '../vibes/InstantsView';
import NotebooksView from '../vibes/NotebooksView';
import GamesView from '../vibes/GamesView';

const VibesTab = ({ onExitFullScreen, activeVibe, setActiveVibe }) => {
  
  if (activeVibe === 'instants') return <InstantsView onBack={() => setActiveVibe(null)} />;
  if (activeVibe === 'notebooks') return <NotebooksView onBack={() => setActiveVibe(null)} />;
  if (activeVibe === 'panic') return <PanicView onBack={() => setActiveVibe(null)} />;
  if (activeVibe === 'awards') return <AwardsView onBack={() => setActiveVibe(null)} />;
  if (activeVibe === 'quotes') return <QuotesView onBack={() => setActiveVibe(null)} />;
  if (activeVibe === 'confessions') return <ConfessionsView onBack={() => setActiveVibe(null)} />;
  if (activeVibe === 'time_capsule') return <TimeCapsuleView onBack={() => setActiveVibe(null)} />;
  if (activeVibe === 'games') return <GamesView onBack={() => setActiveVibe(null)} />;
  
  const banners = [
    { id: 'instants', title: 'اللقطات الفورية', desc: 'شارك لحظتك العفوية (تختفي بعد المشاهدة)', icon: Zap, color: 'linear-gradient(135deg, #F97316, #EC4899)' },
    { id: 'notebooks', title: 'دفاتر التخرج', desc: 'توقيعات ورسائل تبقى للذكرى', icon: Book, color: 'linear-gradient(135deg, #2563EB, #1E3A8A)' },
    { id: 'panic', title: 'زر الفزعة', desc: 'اطلب المساعدة العاجلة من الدفعة', icon: AlertTriangle, color: 'linear-gradient(135deg, #EF4444, #991B1B)' },
    { id: 'awards', title: 'جوائز الدفعة', desc: 'صوّت لأكثر المواقف والشخصيات المضحكة', icon: Crown, color: 'linear-gradient(135deg, #F59E0B, #B45309)' },
    { id: 'quotes', title: 'اقتباسات الدكاترة', desc: 'أجمل وأغرب ما قيل في المحاضرات', icon: Quote, color: 'linear-gradient(135deg, #3B82F6, #1E3A8A)' },
    { id: 'confessions', title: 'حائط المجهول', desc: 'اعترف وفضفض براحتك وبسرية تامة', icon: Ghost, color: 'linear-gradient(135deg, #D946EF, #701A75)' },
    { id: 'time_capsule', title: 'كبسولة الزمن', desc: 'ذكريات سرية مقفلة حتى يوم التخرج', icon: Lock, color: 'linear-gradient(135deg, #10B981, #065F46)' },
    { id: 'games', title: 'الألعاب (Games)', desc: 'العب مع أصدقائك في تحديات فورية ومسلية', icon: Zap, color: 'linear-gradient(135deg, #8B5CF6, #4C1D95)' },
  ];

  return (
    <div id="vibes-menu-active" style={{ padding: '24px 16px', background: 'var(--bg-dark)', minHeight: '100vh', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '32px', textAlign: 'center', animation: 'fadeInDown 0.5s ease-out', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, cursor: 'pointer', background: 'var(--glass)', borderRadius: '50%', padding: '8px', zIndex: 10, border: '1px solid var(--glass-border)' }} onClick={onExitFullScreen}>
          <ChevronLeft size={28} color="var(--text-primary)" />
        </div>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <Flame size={48} color="#F59E0B" />
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
          فعاليات الدفعة
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '300px', margin: '0 auto' }}>مكان واحد يجمع ذكرياتنا ومواقفنا التي لا تُنسى في الجامعة</p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 100%, 450px), 1fr))', 
        gap: '20px' 
      }}>
        {banners.map((banner, index) => (
          <motion.div 
            key={banner.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setActiveVibe(banner.id)} 
            style={{ 
              background: banner.color, borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.15 }}>
              <banner.icon size={160} color="white" />
            </div>
            
            <div style={{ zIndex: 1, flex: 1, paddingLeft: '16px' }}>
              <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <banner.icon size={24} /> {banner.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: '1.4' }}>{banner.desc}</p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '50%', width: '40px', height: '40px', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChevronLeft size={20} color="white" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VibesTab;
