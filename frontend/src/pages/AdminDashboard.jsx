import React, { useState, useEffect } from 'react';
import { 
  Users, LayoutDashboard, Flag, Shield, 
  TrendingUp, TrendingDown, UserPlus, FileText, 
  MessageSquare, AlertCircle, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const StatsCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div style={{ padding: '12px', background: `${color}15`, borderRadius: '16px' }}>
        <Icon color={color} size={24} />
      </div>
      {trend && (
        <span style={{ fontSize: '0.8rem', color: trend > 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>{title}</p>
    <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>{value}</h3>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div style={{ color: 'white' }}>جاري تحميل الإحصائيات...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>نظرة عامة</h1>
          <p style={{ color: '#94a3b8' }}>مراقبة أداء المنصة والنشاط المباشر.</p>
        </div>
        <button onClick={fetchStats} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={18} /> تحديث
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatsCard title="إجمالي المستخدمين" value={stats?.totalUsers || 0} icon={Users} color="#3b82f6" trend={12} />
        <StatsCard title="النشطين اليوم" value={stats?.activeToday || 0} icon={TrendingUp} color="#10b981" />
        <StatsCard title="المنشورات" value={stats?.totalPosts || 0} icon={FileText} color="#f59e0b" trend={5} />
        <StatsCard title="بلاغات معلقة" value={stats?.pendingReports || 0} icon={AlertCircle} color="#ef4444" />
      </div>

      <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.3)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>نمو المستخدمين (آخر 7 أيام)</h3>
        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.userGrowth || []}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: 'white' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
