import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';
import api from '../../services/api';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addPost } = useAppStore();
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && !image) return;
    setLoading(true);
    try {
      let mediaUrl = '';
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        const uploadRes = await api.post('/upload/image', formData);
        mediaUrl = uploadRes.data.url;
      }

      await addPost(text, mediaUrl);
      toast.success('تم نشر المنشور بنجاح');
      setText('');
      setImage(null);
      setPreviewUrl(null);
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err) {
      toast.error('فشل نشر المنشور');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(10, 15, 28, 0.8)', backdropFilter: 'blur(8px)' }}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-dark)', borderRadius: '24px', border: '1px solid var(--glass-border)', overflow: 'hidden', position: 'relative', zIndex: 5001 }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>إنشاء منشور جديد</h3>
          <X size={24} color="var(--text-secondary)" onClick={onClose} style={{ cursor: 'pointer' }} />
        </div>

        <div style={{ padding: '20px' }}>
          <textarea 
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="ماذا يدور في ذهنك؟"
            style={{ width: '100%', minHeight: '120px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.1rem', outline: 'none', resize: 'none', padding: 0 }}
          />

          {previewUrl && (
            <div style={{ position: 'relative', marginTop: '16px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
              <img src={previewUrl} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
              <div 
                onClick={() => { setImage(null); setPreviewUrl(null); }}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}
              >
                <X size={18} color="white" />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div 
            onClick={() => fileInputRef.current.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', cursor: 'pointer', fontWeight: '500' }}
          >
            <ImageIcon size={20} />
            إضافة صورة
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && !image)}
            className="btn-primary"
            style={{ padding: '10px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            نشر
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;
