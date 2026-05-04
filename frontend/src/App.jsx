import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';

// Pages
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AdminHubPage from './pages/AdminHubPage';
import AdminDashboard from './pages/AdminDashboard'; // Analytics
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import SecurityPage from './pages/SecurityPage';
import SiteControlPage from './pages/SiteControlPage';
import ContentPage from './pages/ContentPage';
import LogsPage from './pages/LogsPage';
import AdminHubsPage from './pages/AdminHubsPage';
import NotFoundPage from './pages/NotFoundPage';

// Layouts & Guards
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import api from './services/api';
import GlobalAlertBanner from './components/common/GlobalAlertBanner';

// Styles
import './styles/index.css';

const ProtectedRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (!token || !user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { token, user } = useAuthStore();
  const { siteSettings } = useAppStore();
  const [maintenance, setMaintenance] = useState(null);
  const isLoggedIn = !!(token && user);

  // Global Site Status Check
  useEffect(() => {
    if (!isLoggedIn) return;
    const checkStatus = async () => {
      try {
        const { data } = await api.get('/admin/settings');
        const settings = data.data;
        if (settings.maintenanceMode) {
          const isStaff = user && ['moderator', 'admin', 'superadmin'].includes(user.role);
          if (!isStaff && (settings.maintenanceType === 'lockdown' || settings.maintenanceType === 'emergency')) {
            setMaintenance(settings);
          }
        }
      } catch (err) {
        if (err.response?.status === 403) {
          toast.error(err.response.data.message || 'تم حظر وصولك للمنصة');
        }
      }
    };
    checkStatus();
  }, [user, isLoggedIn]);

  // Sync maintenance state with global store for real-time lockdown
  useEffect(() => {
    if (siteSettings?.maintenanceMode) {
      const isStaff = user && ['moderator', 'admin', 'superadmin'].includes(user.role);
      if (!isStaff && (siteSettings.maintenanceType === 'lockdown' || siteSettings.maintenanceType === 'emergency')) {
        setMaintenance(siteSettings);
      } else {
        setMaintenance(null);
      }
    } else {
      setMaintenance(null);
    }
  }, [siteSettings, user]);

  // Apply Theme
  useEffect(() => {
    const theme = user?.theme || 'dark';
    document.body.setAttribute('data-theme', theme);
    document.documentElement.lang = user?.language || 'ar';
    document.documentElement.dir = (user?.language === 'ar' || !user?.language) ? 'rtl' : 'ltr';
  }, [user]);

  if (maintenance) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        background: 'var(--bg-dark)', color: 'white', textAlign: 'center', padding: '24px', position: 'relative', overflow: 'hidden' 
      }}>
        <div style={{ 
          position: 'absolute', width: '300px', height: '300px', 
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)', zIndex: 0 
        }} />
        <div className="auth-glass" style={{ maxWidth: '500px', zIndex: 1 }}>
          <div className="auth-inner">
            <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🛠️</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '16px' }}>{maintenance.maintenanceMessage}</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>نحن نجري بعض التحسينات التقنية لضمان أفضل تجربة لدفعتنا، سنعود قريباً جداً.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <GlobalAlertBanner />
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/home" replace /> : <AuthPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        
        {/* Admin Command Center Routes */}
        <Route path="/admin" element={<AdminRoute level="admin"><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminHubPage />} />
          <Route path="analytics" element={<AdminRoute level="admin"><AdminDashboard /></AdminRoute>} />
          <Route path="users" element={<AdminRoute level="admin"><UsersPage /></AdminRoute>} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="hubs" element={<AdminHubsPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="security" element={<AdminRoute level="superadmin"><SecurityPage /></AdminRoute>} />
          <Route path="site" element={<AdminRoute level="admin"><SiteControlPage /></AdminRoute>} />
          <Route path="logs" element={<AdminRoute level="superadmin"><LogsPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
