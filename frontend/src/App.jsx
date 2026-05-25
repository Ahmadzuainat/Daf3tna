import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Analytics } from '@vercel/analytics/react';

// Lazy Loaded Pages
const AuthPage = lazy(() => import('./pages/AuthPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const AdminHubPage = lazy(() => import('./pages/AdminHubPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const SiteControlPage = lazy(() => import('./pages/SiteControlPage'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const LogsPage = lazy(() => import('./pages/LogsPage'));
const AdminHubsPage = lazy(() => import('./pages/AdminHubsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Layouts & Guards
const AdminLayout = lazy(() => import('./components/AdminLayout'));
import AdminRoute from './components/AdminRoute';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import api from './services/api';
import GlobalAlertBanner from './components/common/GlobalAlertBanner';

// Styles
import './styles/index.css';

const PageLoader = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
    <div className="spinner"></div>
  </div>
);

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

  useEffect(() => {
    const theme = user?.theme || 'dark';
    document.body.setAttribute('data-theme', theme);
    document.documentElement.lang = user?.language || 'ar';
    document.documentElement.dir = (user?.language === 'ar' || !user?.language) ? 'rtl' : 'ltr';
  }, [user]);

  if (maintenance) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'white', textAlign: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
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
      <Analytics />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/home" replace /> : <AuthPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          
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
      </Suspense>
    </Router>
  );
}

export default App;
