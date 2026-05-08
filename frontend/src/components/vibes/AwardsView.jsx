import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowRight, Crown, Star, Search as SearchIcon, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AwardsView = ({ onBack }) => {
  const { awards, fetchAwards, voteAward, createAward, deleteAward, users, fetchUsers } = useAppStore();
  const { user: me } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [awardTitle, setAwardTitle] = useState('');
  const [duration, setDuration] = useState('24h');
  const [voting, setVoting] = useState(null);

  useEffect(() => { fetchAwards(); fetchUsers(); }, [fetchAwards, fetchUsers]);

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) && u._id !== me?._id
  );

  const handleVote = async (id) => {
    if (voting) return;
    setVoting(id);
    try { 
      await voteAward(id); 
      toast.success('تم التصويت بنجاح! 🏆');
    } catch(e) { 
      toast.error(e?.response?.data?.message || 'سبق وصوتت على هذا اللقب'); 
    } finally { setVoting(null); }
  };

  const handleCreate = async () => {
    if (!selectedUser || !awardTitle) return;
    try {
      await createAward(awardTitle, selectedUser._id, duration);
      setShowModal(false); setSelectedUser(null); setAwardTitle(''); setSearchQuery('');
      toast.success('تم إنشاء اللقب بنجاح! 🎉');
    } catch(e) { toast.error('حدث خطأ في إنشاء الجائزة'); }
  };
  
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذه الجائزة؟')) return;
    try {
      await deleteAward(id);
      toast.success('تم حذف الجائزة بنجاح');
    } catch(e) {
      toast.error('فشل حذف الجائزة');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #78350F 0%, var(--bg-dark) 50%)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ArrowRight size={32} color="white" onClick={onBack} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '4px' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>قاعة المشاهير والجوائز</h2>
      </header>

      <div style={{ flex: 1, padding: '24px 16px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Crown size={60} color="#F59E0B" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', textShadow: '0 4px 20px rgba(245, 158, 11, 0.5)' }}>أساطير الدفعة</h1>
          {(me?.role === 'superadmin' || me?.role === 'admin') && (
            <p style={{ color: '#10B981', fontSize: '0.8rem', marginTop: '8px' }}>وضع المسؤول نشط ({me.role})</p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px' }}>
          {awards.map((award, idx) => {
            const alreadyVoted = award.votes?.some(v => (v._id || v)?.toString() === me?._id);
            const img = award.user?.avatarUrl || `https://ui-avatars.com/api/?name=${award.user?.fullName || 'U'}&background=6D28D9&color=fff`;
            return (
              <div key={award._id} onClick={() => !alreadyVoted && handleVote(award._id)} 
                style={{ 
                  background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', 
                  display: 'flex', alignItems: 'center', gap: '20px', 
                  border: `1px solid ${alreadyVoted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.2)'}`, 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden', 
                  cursor: alreadyVoted ? 'default' : 'pointer', transition: 'transform 0.2s',
                  opacity: voting === award._id ? 0.7 : 1
                }}>
                <div style={{ position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)', fontSize: '120px', opacity: 0.05, fontWeight: 'bold' }}>{idx + 1}</div>
                
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #FCD34D)', padding: '4px' }}>
                    <img src={img} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bg-dark)' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', background: alreadyVoted ? '#10B981' : '#F59E0B', color: 'var(--bg-dark)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={12} fill="var(--bg-dark)" /> {award.votes?.length || 0}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ color: 'var(--primary-blue)', fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>اللـقـب</h4>
                  <p style={{ color: 'white', fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '8px', lineHeight: '1.4' }}>"{award.title}"</p>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>المرشح: {award.user?.fullName}</span>
                  {alreadyVoted && <span style={{ display: 'block', color: '#10B981', fontSize: '0.85rem', marginTop: '4px' }}>✓ صوتت بالفعل</span>}
                </div>

                {(me?.role === 'superadmin' || me?.role === 'admin') && (
                  <button 
                    onClick={(e) => handleDelete(e, award._id)}
                    style={{ 
                      position: 'absolute', top: '10px', left: '10px',
                      background: '#EF4444', border: 'none', 
                      padding: '12px', borderRadius: '14px', color: 'white', cursor: 'pointer',
                      zIndex: 100, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <Trash2 size={22} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        <div style={{ position: 'fixed', bottom: '24px', left: '24px', right: '24px', zIndex: 50, maxWidth: '600px', margin: '0 auto' }}>
          <button onClick={() => setShowModal(true)} style={{ width: '100%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', border: 'none', padding: '18px', borderRadius: '24px', fontSize: '1.3rem', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
             فتح تصويت للقب جديد 🏆
          </button>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <header style={{ padding: '24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
             <ArrowRight size={32} color="white" onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
             <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 'bold' }}>لقب جديد</h2>
             <div style={{ width: '32px' }} />
          </header>

          <div style={{ padding: '24px 16px', flex: 1, overflowY: 'auto' }}>
            <label style={{ color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>ابحث عن المرشح</label>
            {!selectedUser ? (
              <>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <SearchIcon size={20} color="var(--text-secondary)" style={{ marginRight: '12px' }} />
                  <input style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }} placeholder="اكتب اسم الطالب..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', marginBottom: '24px' }}>
                  {filteredUsers.map(u => (
                    <div key={u._id} onClick={() => setSelectedUser(u)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer' }}>
                      <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.fullName}&background=6D28D9&color=fff`} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ color: 'white', fontWeight: 'bold' }}>{u.fullName}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary-blue)', borderRadius: '16px', marginBottom: '24px' }}>
                <img src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${selectedUser.fullName}&background=6D28D9&color=fff`} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'white', fontWeight: 'bold', display: 'block' }}>{selectedUser.fullName}</span>
                  <span style={{ color: 'var(--primary-blue)', fontSize: '0.85rem' }}>تم اختياره كمرشح</span>
                </div>
                <X size={24} color="var(--text-secondary)" style={{ cursor: 'pointer' }} onClick={() => setSelectedUser(null)} />
              </div>
            )}

            <label style={{ color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>اسم اللقب (مثال: أذكى شخص)</label>
            <input style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px', color: 'white', fontSize: '1.1rem', outline: 'none', marginBottom: '24px' }} placeholder="اكتب اللقب هنا..." value={awardTitle} onChange={e => setAwardTitle(e.target.value)} />

            <label style={{ color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>مدة التصويت</label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              {['24h', '3days', '1week'].map(d => (
                <div key={d} onClick={() => setDuration(d)} style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', background: duration === d ? '#F59E0B' : 'rgba(255,255,255,0.05)', color: duration === d ? 'var(--bg-dark)' : 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  {d === '24h' ? '24 ساعة' : d === '3days' ? '3 أيام' : 'أسبوع'}
                </div>
              ))}
            </div>

            <button onClick={handleCreate} disabled={!selectedUser || !awardTitle} style={{ width: '100%', background: (!selectedUser || !awardTitle) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #F59E0B, #D97706)', color: (!selectedUser || !awardTitle) ? 'var(--text-secondary)' : 'white', border: 'none', padding: '18px', borderRadius: '24px', fontSize: '1.2rem', fontWeight: 'bold', cursor: (!selectedUser || !awardTitle) ? 'not-allowed' : 'pointer' }}>
               نشر التصويت
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AwardsView;
