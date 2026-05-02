import React, { useState, useEffect } from 'react';
import { Layers, Trash2, Eye, EyeOff, Star, AlertCircle, FileText, Film, MoreVertical, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const ContentPage = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getImageUrl = (url) => {
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) return "https://via.placeholder.com/150";
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'https://daf3tna.onrender.com';
    const cleanBase = baseUrl.endsWith('/api') ? baseUrl.replace('/api', '') : baseUrl;
    return `${cleanBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'posts' 
        ? `/admin/content/posts?page=${p}&limit=12` 
        : '/admin/content/stories';
      
      console.log(`📡 ContentPage: Fetching ${activeTab} from ${endpoint}`);
      const res = await api.get(endpoint);
      const data = res.data;
      
      if (activeTab === 'posts') {
        setItems(data.data || []);
        setTotalPages(data.pages || 1);
      } else {
        setItems(data.data || []);
      }
    } catch (err) {
      console.error('❌ ContentPage Fetch Error:', err.response?.data || err.message);
      toast.error('فشل في جلب المحتوى');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المحتوى نهائياً؟')) return;
    try {
      const endpoint = activeTab === 'posts' 
        ? `admin/content/posts/${id}` 
        : `admin/content/stories/${id}`;
      await api.delete(endpoint);
      toast.success('تم حذف المحتوى');
      fetchData(page);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {items.map((item) => (
            <div key={item._id} className="instagram-card" style={{ 
              background: 'rgba(15, 23, 42, 0.6)', 
              borderRadius: '20px', 
              overflow: 'hidden', 
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              transition: 'transform 0.3s ease'
            }}>
              {/* Card Header */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '36px', height: '36px', borderRadius: '50%', padding: '2px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                     <img src={getImageUrl(item.user?.avatarUrl)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0f172a' }} />
                   </div>
                   <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>{item.user?.fullName}</span>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Card Media */}
              <div style={{ width: '100%', aspectRatio: '1/1', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {(item.mediaUrls?.[0] || item.mediaUrl) ? (
                  <img 
                    src={getImageUrl(item.mediaUrls?.[0] || item.mediaUrl)} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ color: '#334155', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <FileText size={48} />
                    <span style={{ fontSize: '0.8rem' }}>منشور نصي فقط</span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Star size={24} color="#ef4444" fill="#ef4444" style={{ cursor: 'pointer' }} />
                    <MessageSquare size={24} color="white" style={{ cursor: 'pointer' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleDelete(item._id)} 
                      style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="حذف المنشور"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
                
                <div style={{ color: 'white', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  <span style={{ fontWeight: 'bold', marginLeft: '8px' }}>{item.user?.username || item.user?.fullName}</span>
                  {item.text || (activeTab === 'stories' ? 'قصة جديدة' : 'لا يوجد نص')}
                </div>
                
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '8px', textTransform: 'uppercase' }}>
                  {new Date(item.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>لا يوجد محتوى لعرضه حالياً.</div>}
      </div>

      {activeTab === 'posts' && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '32px' }}>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => { setPage(i + 1); fetchData(i + 1); }}
              style={{
                width: '40px', height: '40px', borderRadius: '10px', border: 'none',
                background: page === i + 1 ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                color: 'white', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentPage;
