import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const AdminLayout = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isHub = location.pathname === '/admin';

  return (
    <div className="admin-layout" style={{ minHeight: '100vh', background: '#0a0f1c', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      {/* Dynamic Header */}
      {!isHub && (
        <header style={{ 
          padding: '16px 20px', 
          background: 'rgba(15, 23, 42, 0.8)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <button 
            onClick={() => navigate('/admin')}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: 'none', 
              padding: '8px', 
              borderRadius: '50%', 
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowRight size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#8b5cf6" />
            <h2 style={{ fontSize: '1rem', fontWeight: 'bold' }}>إدارة المنصة</h2>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
