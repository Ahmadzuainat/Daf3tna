import React, { useEffect } from 'react';
import { PlusSquare, Users, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

const HubsListTab = ({ onHubClick }) => {
  const { hubs, fetchHubs } = useAppStore();
  const { user } = useAuthStore();
  
  useEffect(() => { 
    fetchHubs(); 
  }, [fetchHubs]);

  const COLORS = [
    'linear-gradient(135deg,#EF4444,#F97316)',
    'linear-gradient(135deg,#F59E0B,#FCD34D)',
    'linear-gradient(135deg,#3B82F6,#8B5CF6)',
    'linear-gradient(135deg,#8B5CF6,#D946EF)',
    'linear-gradient(135deg,#10B981,#34D399)',
    'linear-gradient(135deg,#EC4899,#F43F5E)',
  ];

  if (hubs.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        جاري تحميل الغرف...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>اكتشف الغرف (Hubs)</h2>
        <Settings />
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(260px, 100%, 400px), 1fr))', gap: '16px' }}>
        {hubs.map((hub, idx) => {
          const joined = hub.isJoined || hub.members?.some(m => (m._id || m).toString() === user?._id?.toString());
          
          return (
            <div key={hub._id} onClick={() => onHubClick({ ...hub, isJoined: joined })}
              style={{ background: hub.color || COLORS[idx % COLORS.length], borderRadius: '24px', padding: '16px', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.2s,box-shadow 0.2s', boxShadow: joined ? '0 0 0 2px rgba(16,185,129,0.6)' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow = joined ? '0 0 0 2px rgba(16,185,129,0.6)' : 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: joined ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {joined ? '✅' : <PlusSquare size={16} color="white" />}
                </div>
                {joined && <span style={{ background: 'rgba(16,185,129,0.25)', color: '#10B981', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>عضو</span>}
              </div>
              <div style={{ fontSize: '52px', alignSelf: 'center' }}>{hub.icon || '🏠'}</div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{hub.name}</h4>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <Users size={12} /> {hub.members?.length || 0} عضو
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HubsListTab;
