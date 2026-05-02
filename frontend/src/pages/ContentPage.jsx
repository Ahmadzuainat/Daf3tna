import React, { useState, useEffect } from 'react';
import { Layers, Trash2, Eye, EyeOff, Star, AlertCircle, FileText, Film } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const ContentPage = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Reusing general admin search or specific routes
      const endpoint = activeTab === 'posts' ? '/api/posts' : '/api/stories';
      const { data } = await api.get(endpoint);
      // Note: In a real app, we'd have a specific /admin/content route for better control
      setItems(data);
    } catch (err) {
      toast.error('فشل في جلب المحتوى');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المحتوى نهائياً؟')) return;
    try {
      await api.delete(`${activeTab === 'posts' ? '/api/posts' : '/api/stories'}/${id}`);
      toast.success('تم حذف المحتوى');
      fetchData();
    } catch (err) {
      toast.error('خطأ في الحذف');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>إدارة المحتوى</h1>
          <p style={{ color: '#94a3b8' }}>التحكم في المنشورات، القصص، والتعليقات العامة.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('posts')}
          style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'posts' ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: activeTab === 'posts' ? 'white' : '#94a3b8' }}
        >
          <FileText size={18} /> المنشورات
        </button>
        <button 
          onClick={() => setActiveTab('stories')}
          style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'stories' ? '#ec4899' : 'rgba(255,255,255,0.05)', color: activeTab === 'stories' ? 'white' : '#94a3b8' }}
        >
          <Film size={18} /> القصص (Stories)
        </button>
      </div>

      <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {items.map((item) => (
            <div key={item._id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', overflow: 'hidden', border: '1px solid #333' }}>
              {item.mediaUrls?.[0] && (
                <img src={item.mediaUrls[0]} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
              )}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                   <img src={item.user?.avatarUrl || `https://ui-avatars.com/api/?name=${item.user?.fullName}`} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                   <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.user?.fullName}</span>
                </div>
                <p style={{ color: 'white', fontSize: '0.9rem', marginBottom: '16px', height: '40px', overflow: 'hidden' }}>{item.text || 'محتوى مرئي'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                   <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleDelete(item._id)} style={{ padding: '6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                      <button style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
                        <Eye size={16} />
                      </button>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>لا يوجد محتوى لعرضه حالياً.</div>}
      </div>
    </div>
  );
};

export default ContentPage;
