import React, { useState, useEffect } from 'react';
import { Camera, Trash2, Lock, Heart, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import api from '../../services/api';
import { toast } from 'sonner';

const InstantsView = () => {
  const { user } = useAuthStore();
  const { instants, fetchInstants, addInstant, deleteInstant } = useAppStore();
  const [selectedInstant, setSelectedInstant] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingInstant, setDeletingInstant] = useState(null);

  useEffect(() => {
    fetchInstants();
  }, [fetchInstants]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload', formData);
      await addInstant(res.data.imageUrl);
      toast.success('تمت إضافة اللقطة! ✨');
    } catch (err) {
      toast.error('خطأ في الرفع');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingInstant) return;
    try {
      await deleteInstant(deletingInstant);
      setDeletingInstant(null);
      toast.success('تم الحذف بنجاح');
    } catch (err) {
      toast.error('خطأ في الحذف');
    }
  };

  return (
    <div style={{ padding: '24px 16px', background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>اللقطات الفورية</h2>
        <p style={{ color: 'var(--text-secondary)' }}>شارك لحظاتك العفوية التي تختفي بسرعة</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
        <label style={{ cursor: 'pointer', position: 'relative' }}>
          <input type="file" hidden onChange={handleUpload} accept="image/*" />
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(236, 72, 153, 0.3)', position: 'relative' }}>
            {uploading ? (
              <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Camera size={48} color="white" />
            )}
            <div style={{ position: 'absolute', top: '0', right: '0', background: 'white', borderRadius: '50%', padding: '4px' }}>
               <X size={24} color="#EC4899" style={{ transform: 'rotate(45deg)' }} />
            </div>
          </div>
        </label>
        <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>شارك لحظتك</h3>
      </div>

      <div style={{ padding: '24px 16px', background: 'var(--surface-dark)', borderRadius: '32px' }}>
        <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '16px', fontSize: '1.1rem' }}>لقطات الأصدقاء</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '20px' }}>
          {instants.map(instant => {
            const isOwner = (instant.user?._id || instant.user) === user?._id;
            const isViewed = !isOwner && instant.viewers?.includes(user?._id);
            return (
              <div key={instant._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <div 
                  onClick={() => { if (!isViewed) setSelectedInstant(instant); }}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', background: isViewed ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #F97316, #EC4899)', padding: '3px', opacity: isViewed ? 0.5 : 1, cursor: isViewed ? 'default' : 'pointer' }}
                >
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                    <img src={instant.user?.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isViewed ? 'grayscale(100%)' : 'blur(4px)' }} />
                    {!isViewed && <Lock size={20} color="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
                  </div>
                </div>
                {isOwner && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); setDeletingInstant(instant._id); }}
                    style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#EF4444', color: 'white', border: '2px solid var(--surface-dark)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}
                  >
                    <Trash2 size={14} />
                  </div>
                )}
                <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 'bold' }}>{instant.user?.fullName?.split(' ')[0] || 'مستخدم'}</span>
              </div>
            );
          })}
          {instants.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>لا توجد لقطات جديدة</p>}
        </div>
      </div>

      {deletingInstant && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
           <div style={{ background: 'rgba(30, 41, 59, 0.95)', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '32px', textAlign: 'center' }}>
              <Trash2 size={32} color="#EF4444" style={{ marginBottom: '24px' }} />
              <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '12px' }}>حذف اللقطة؟</h3>
              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                  <button onClick={handleDelete} style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: 'bold' }}>حذف</button>
                  <button onClick={() => setDeletingInstant(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '16px' }}>إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {selectedInstant && <InstantFullScreenView instant={selectedInstant} onClose={() => setSelectedInstant(null)} />}
    </div>
  );
};

const InstantFullScreenView = ({ instant, onClose }) => {
  const { user } = useAuthStore();
  const { viewInstant, likeInstant } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [currentInstant, setCurrentInstant] = useState(instant);

  useEffect(() => {
    if (instant._id) viewInstant(instant._id);
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(timer); onClose(); return 100; }
        return p + 1;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [instant._id, viewInstant, onClose]);

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const updated = await likeInstant(instant._id);
      setCurrentInstant(updated);
    } catch (err) {}
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', zIndex: 10 }}>
        <div style={{ height: '100%', background: 'white', borderRadius: '2px', width: `${progress}%` }} />
      </div>
      <div style={{ position: 'absolute', top: '32px', left: '16px', right: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={instant.user?.avatarUrl || "https://ui-avatars.com/api/?name=U"} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white' }} />
          <span style={{ color: 'white', fontWeight: 'bold' }}>{currentInstant.user?.fullName}</span>
        </div>
        <div onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: currentInstant.likes?.includes(user?._id) ? '#EF4444' : 'white', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '20px' }}>
          <Heart size={20} fill={currentInstant.likes?.includes(user?._id) ? '#EF4444' : 'none'} />
          <span style={{ fontWeight: 'bold' }}>{currentInstant.likes?.length || 0}</span>
        </div>
      </div>
      <img src={instant.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
};

export default InstantsView;
