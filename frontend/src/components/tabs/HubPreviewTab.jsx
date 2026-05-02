import React from 'react';
import { ChevronLeft, Users } from 'lucide-react';

const HubPreviewTab = ({ hub, onBack, onJoin, joiningHub, isJoined }) => {
  if (!hub) return null;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-dark)' }}>
      <div style={{ position: 'relative', height: '300px', background: hub.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: '24px', left: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '50%', padding: '8px', cursor: 'pointer' }} onClick={onBack}>
          <ChevronLeft size={28} color="white" />
        </div>
        <div style={{ fontSize: '100px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}>{hub.icon}</div>
      </div>
      
      <div style={{ flex: 1, padding: '32px 24px', background: 'var(--surface-dark)', marginTop: '-24px', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{hub.name}</h1>
            <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary-blue)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 'bold' }}>{hub.category}</span>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '32px' }}>
            {hub.description}
          </p>

          {hub.admin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
              <img src={hub.admin?.avatarUrl || hub.admin?.img || `https://ui-avatars.com/api/?name=${hub.admin?.fullName || hub.admin?.name || 'A'}&background=6D28D9&color=fff`} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>مدير الغرفة</p>
                <h4 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{hub.admin?.fullName || hub.admin?.name}</h4>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>
            <Users size={24} color="var(--primary-blue)" /> {hub.members?.length || hub.membersCount || 0} عضو
          </div>
        </div>

        <button
          onClick={isJoined ? () => onJoin(hub) : onJoin}
          disabled={joiningHub}
          style={{ background: joiningHub ? 'rgba(139,92,246,0.5)' : 'var(--gradient-btn)', color: 'white', border: 'none', padding: '18px', borderRadius: '24px', fontSize: '1.2rem', fontWeight: 'bold', width: '100%', cursor: joiningHub ? 'not-allowed' : 'pointer', boxShadow: '0 10px 20px rgba(139,92,246,0.3)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
        >
          {joiningHub ? (
            <><div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> جاري الانضمام...</>
          ) : isJoined ? (
            'دخول إلى الغرفة 🚀'
          ) : (
            'انضمام إلى الغرفة 🚀'
          )}
        </button>
      </div>
    </div>
  );
};

export default HubPreviewTab;
