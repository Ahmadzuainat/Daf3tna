import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Shield, UserX, UserCheck, Trash2, Edit } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/users?search=${search}&page=${page}`);
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
  }, [search, page]);

  const handleModerate = async (userId, action, value) => {
    try {
      await api.put(`/admin/users/${userId}/moderate`, { [action]: value });
      toast.success('تم تحديث بيانات المستخدم');
      fetchUsers();
    } catch (err) {
      toast.error('خطأ في العملية');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>إدارة المستخدمين</h1>
          <p style={{ color: '#94a3b8' }}>التحكم في العضويات، الأدوار، وحظر الحسابات.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} color="#94a3b8" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="البحث بالاسم، البريد، أو التخصص..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 48px 12px 16px', color: 'white', outline: 'none' }}
          />
        </div>
        <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} /> تصفية
        </button>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '16px 24px', color: '#94a3b8', fontWeight: '500' }}>المستخدم</th>
              <th style={{ padding: '16px 24px', color: '#94a3b8', fontWeight: '500' }}>البريد الإلكتروني</th>
              <th style={{ padding: '16px 24px', color: '#94a3b8', fontWeight: '500' }}>الدور</th>
              <th style={{ padding: '16px 24px', color: '#94a3b8', fontWeight: '500' }}>الحالة</th>
              <th style={{ padding: '16px 24px', color: '#94a3b8', fontWeight: '500' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: '#94a3b8' }}>{u.email}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold',
                    background: u.role === 'admin' ? '#3b82f620' : (u.role === 'moderator' ? '#8b5cf620' : 'rgba(255,255,255,0.05)'),
                    color: u.role === 'admin' ? '#3b82f6' : (u.role === 'moderator' ? '#8b5cf6' : '#94a3b8')
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem',
                    background: u.status === 'active' ? '#10b98120' : '#ef444420',
                    color: u.status === 'active' ? '#10b981' : '#ef4444'
                  }}>
                    {u.status === 'active' ? 'نشط' : 'محظور'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {u.status === 'active' ? (
                      <button onClick={() => handleModerate(u._id, 'status', 'banned')} title="حظر" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                        <UserX size={18} />
                      </button>
                    ) : (
                      <button onClick={() => handleModerate(u._id, 'status', 'active')} title="إلغاء الحظر" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', cursor: 'pointer' }}>
                        <UserCheck size={18} />
                      </button>
                    )}
                    <button onClick={() => handleModerate(u._id, 'role', u.role === 'user' ? 'moderator' : 'user')} title="تغيير الرتبة" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'none', cursor: 'pointer' }}>
                      <Shield size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>لا يوجد مستخدمين لعرضهم.</div>}
      </div>
    </div>
  );
};

export default UsersPage;
