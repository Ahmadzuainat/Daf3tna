import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Ghost } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-dark)',
      padding: '24px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{ 
        position: 'absolute', 
        width: '400px', height: '400px', 
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-glass"
        style={{ maxWidth: '500px', width: '100%', position: 'relative', zIndex: 1 }}
      >
        <div className="auth-inner">
          <div style={{ marginBottom: '32px' }}>
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Ghost size={80} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
            </motion.div>
          </div>

          <h1 style={{ fontSize: '4rem', fontWeight: 'bold', margin: '0', color: 'var(--text-primary)', letterSpacing: '-2px' }}>
            404
          </h1>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
            عذراً، ضعت في أروقة الجامعة!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
            يبدو أنك تحاول الوصول إلى صفحة غير موجودة أو تم نقلها. لا تقلق، يمكنك العودة إلى الدفعة بسهولة.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/home')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Home size={20} />
              العودة للرئيسية
            </button>
            
            <button 
              onClick={() => navigate(-1)}
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ArrowLeft size={20} />
              الرجوع للخلف
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
