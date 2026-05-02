import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Shield, UserX, UserCheck, Trash2, Edit } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showOnlyOnline, setShowOnlyOnline] = useState(false);
   const { user: authUser } = useAuthStore();
 
   useEffect(() => {
     console.log('👤 Current Admin User:', authUser);
   }, [authUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = showOnlyOnline ? '/admin/users/online' : `/admin/users?search=${search}&page=${page}`;
      const { data } = await api.get(endpoint);
      setUsers(data.data);
    } catch (err) {
      toast.error('فشل في جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search, page, showOnlyOnline]);

  const handleModerate = async (userId, action, value) => {
    try {
      await api.put(`/admin/users/${userId}/moderate`, { [action]: value });
      toast.success('تم التحديث بنجاح');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ في العملية');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>إدارة المستخدمين 👥</h1>
          <p style={{ color: '#94a3b8' }}>مراقبة النشاط والتحكم في صلاحيات العضويات.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowOnlyOnline(!showOnlyOnline)}
            style={{ 
              background: showOnlyOnline ? '#10b981' : 'rgba(255,255,255,0.05)', 
              color: showOnlyOnline ? 'black' : 'white', 
              border: 'none', padding: '10px 20px', borderRadius: '12px', 
              fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' 
            }}
          >
            {showOnlyOnline ? 'عرض الكل' : 'المتصلون الآن'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} color="#94a3b8" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="البحث بالاسم، اليوزر، أو الإيميل..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 48px 14px 16px', color: 'white', outline: 'none' }}
          />
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.4)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '20px 24px', color: '#94a3b8', fontWeight: 'bold' }}>المستخدم</th>
              <th style={{ padding: '20px 24px', color: '#94a3b8', fontWeight: 'bold' }}>الدور / الرتبة</th>
              <th style={{ padding: '20px 24px', color: '#94a3b8', fontWeight: 'bold' }}>آخر نشاط</th>
              <th style={{ padding: '20px 24px', color: '#94a3b8', fontWeight: 'bold' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.fullName}`} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.05)' }} />
                      {u.isOnline && (
                        <div style={{ position: 'absolute', bottom: '2px', left: '2px', width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', border: '2px solid #0f172a', boxShadow: '0 0 10px #10b981' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <select 
                    value={u.role}
                    disabled={u.role === 'superadmin' && authUser.email !== 'ahmaded252a@gmail.com'}
                    onChange={(e) => handleModerate(u._id, 'role', e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#3b82f6', borderRadius: '8px', padding: '6px 12px', outline: 'none' }}
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    {authUser.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
                  </select>
                </td>
                <td style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  {u.isOnline ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>متصل الآن</span> : new Date(u.lastSeen || u.updatedAt).toLocaleString('ar-EG')}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleModerate(u._id, 'status', u.status === 'active' ? 'banned' : 'active')} 
                      style={{ 
                        padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: u.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: u.status === 'active' ? '#ef4444' : '#10b981'
                      }}
                    >
                      {u.status === 'active' ? <UserX size={20} /> : <UserCheck size={20} />}
                    </button>

                    {authUser?.role?.toLowerCase() === 'superadmin' && (
                      <button 
                        onClick={async () => {
                          alert('تم الضغط على زر الحذف');
                          if (!window.confirm('حذف نهائي؟')) return;
                          try {
                            await api.delete(`admin/users/${u._id}`);
                            toast.success('تم الحذف');
                            fetchUsers();
                          } catch (err) {
                            alert('خطأ: ' + err.message);
                          }
                        }}
                        style={{ 
                          padding: '10px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                          background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444',
                          zIndex: 999, position: 'relative'
                        }}
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>لا يوجد بيانات لعرضها حالياً.</div>}
      </div>
    </div>
  );
};

export default UsersPage;
