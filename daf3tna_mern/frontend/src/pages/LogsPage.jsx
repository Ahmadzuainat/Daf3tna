import React, { useState, useEffect } from 'react';
import { History, Search, Filter, RefreshCw, ShieldAlert } from 'lucide-react';
import api from '../services/api';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/logs');
      setLogs(data.data);
    } catch (err) {
      console.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History color="#94a3b8" /> سجل العمليات
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>تتبع كافة التحركات الإدارية والقرارات المتخذة.</p>
      </div>

      <div className="glass-card" style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {logs.map((log, i) => (
            <div key={log._id} style={{ 
              padding: '16px', 
              borderBottom: i === logs.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
               <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
                  <ShieldAlert size={18} color="#3b82f6" />
               </div>
               <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                     <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>{log.admin?.fullName}</span>
                     <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    <span style={{ color: 'white' }}>{log.action}</span> على {log.targetType}
                  </p>
                  {log.details && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                       {JSON.stringify(log.details)}
                    </div>
                  )}
               </div>
            </div>
          ))}
          {logs.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>لا يوجد سجلات حالياً.</div>}
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
