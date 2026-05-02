import React, { useState, useEffect } from 'react';
import { Flag, CheckCircle, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/reports');
      setReports(data.data);
    } catch (err) {
      toast.error('فشل في جلب البلاغات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (reportId, status) => {
    const note = prompt('أدخل ملاحظة القرار:');
    if (note === null) return;
    
    try {
      await api.put(`/admin/reports/${reportId}`, { status, note });
      toast.success('تم معالجة البلاغ بنجاح');
      fetchReports();
    } catch (err) {
      toast.error('خطأ في معالجة البلاغ');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>بلاغات المستخدمين</h1>
          <p style={{ color: '#94a3b8' }}>مراجعة الشكاوى، المحتوى المسيء، وحل النزاعات.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {reports.map((r) => (
          <div key={r._id} className="glass-card" style={{ 
            padding: '20px', 
            borderRadius: '20px', 
            border: '1px solid rgba(255,255,255,0.05)',
            background: r.status === 'pending' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(30, 41, 59, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
               <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                  <Flag size={20} color="#ef4444" />
               </div>
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: 'white' }}>بلاغ عن {r.targetType}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>#{r._id.slice(-6)}</span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px' }}>
                    السبب: <span style={{ color: '#fca5a5' }}>{r.reason}</span> • بواسطة: {r.reporter?.fullName}
                  </p>
                  {r.description && <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>"{r.description}"</p>}
               </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {r.status === 'pending' ? (
                <>
                  <button onClick={() => handleResolve(r._id, 'resolved')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={18} /> حل البلاغ
                  </button>
                  <button onClick={() => handleResolve(r._id, 'dismissed')} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #333', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <XCircle size={18} /> تجاهل
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: r.status === 'resolved' ? '#10b981' : '#94a3b8' }}>
                  {r.status === 'resolved' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  <span style={{ fontWeight: 'bold' }}>{r.status === 'resolved' ? 'تم الحل' : 'تم التجاهل'}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div style={{ padding: '80px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed #333' }}>
            <Clock size={48} color="#333" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#64748b' }}>لا توجد بلاغات معلقة حالياً. العمل نظيف!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
