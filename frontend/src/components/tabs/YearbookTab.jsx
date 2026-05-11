import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Search as SearchIcon } from 'lucide-react';

const YearbookTab = ({ onUserClick }) => {
  const { users, fetchUsers, pagination } = useAppStore();
  const { user: currentUser } = useAuthStore();
  const [query, setQuery] = useState('');

  useEffect(() => { 
    if (users.length === 0) fetchUsers(1); 
  }, []);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && pagination.users.hasMore && !pagination.users.isLoading) {
      fetchUsers(pagination.users.page + 1);
    }
  };

  const batchYear = currentUser?.batchId?.match(/\d{4}/)?.[0] || new Date().getFullYear();
  
  const filtered = users.filter(u => 
    u.fullName?.toLowerCase().includes(query.toLowerCase()) || 
    u.username?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div 
      className="fade-in hide-scrollbar" 
      onScroll={handleScroll}
      style={{ padding: '24px 16px', background: 'var(--bg-dark)', height: 'calc(100vh - 80px)', overflowY: 'auto' }}
    >
      <header style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'serif', letterSpacing: '2px', color: 'var(--text-primary)', marginBottom: '8px' }}>CLASS OF {batchYear}</h1>
        <div style={{ width: '60px', height: '2px', background: 'var(--primary-blue)', margin: '0 auto' }} />
      </header>
      
      <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <SearchIcon color="var(--text-secondary)" size={20} style={{ marginRight: '12px' }} />
        <input 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '1rem', textAlign: 'center' }} 
          placeholder="ابحث عن زميل في الكتاب السنوي..." 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
        />
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '48px' }}>
          {pagination.users.isLoading ? 'جاري التحميل...' : 'لا يوجد نتائج'}
        </p>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(120px, 45%, 180px), 1fr))', 
        gap: '16px',
        paddingBottom: '100px'
      }}>
        {filtered.map(u => (
          <div 
            key={u._id} 
            onClick={() => onUserClick(u)} 
            style={{ 
              background: 'var(--surface-dark)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '16px', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', 
              border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'transform 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ width: '80px', height: '80px', marginBottom: '12px', borderRadius: '50%', padding: '4px', background: 'linear-gradient(135deg, var(--primary-blue), var(--primary-purple))', boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)' }}>
              <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.fullName}&background=1e3a8a&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--bg-dark)' }} />
            </div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{u.fullName}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>@{u.username}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YearbookTab;
