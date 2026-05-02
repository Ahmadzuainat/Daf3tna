import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalAlertBanner = () => {
  const { globalAlert, setSocket } = useAppStore(); // We can set it to null to dismiss locally if we want

  if (!globalAlert) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: globalAlert.type === 'emergency' ? '#EF4444' : '#F59E0B',
          color: 'white',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          fontWeight: 'bold'
        }}
      >
        <AlertCircle size={24} />
        <span style={{ fontSize: '1rem', textAlign: 'center' }}>
          {globalAlert.message}
          {globalAlert.sender && <span style={{ opacity: 0.8, fontSize: '0.8rem', marginLeft: '8px' }}>— بواسطة: {globalAlert.sender}</span>}
        </span>
        {/* Dismiss button (optional) */}
        <button 
          onClick={() => useAppStore.setState({ globalAlert: null })}
          style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
        >
          <X size={18} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalAlertBanner;
