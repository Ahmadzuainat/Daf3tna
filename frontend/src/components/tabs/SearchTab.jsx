import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../../services/api';

const SearchTab = ({ onUserClick }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/users/search-history');
        setHistory(res.data);
      } catch (err) {
        console.error('Failed to fetch search history', err);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const searchTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/search?q=${query}`);
        setResults(res.data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(searchTimer);
  }, [query]);

  const clearHistory = async () => {
    try {
      await api.delete('/users/search-history');
      setHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  const removeHistoryItem = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/users/search-history/${id}`);
      setHistory(prev => prev.filter(h => h._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const displayList = query.trim() ? results : history;

  return (
    <div className="fade-in" style={{ padding: '24px 16px', background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{t('search_title')}</h2>
      </header>

      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '24px', 
        padding: '16px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '32px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <SearchIcon color="var(--text-secondary)" size={24} style={{ marginLeft: '12px' }} />
        <input 
          style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1.1rem' }} 
          placeholder={t('search_placeholder')} 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
        />
      </div>

      {!query.trim() && history.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('search_history')}</h3>
          <button onClick={clearHistory} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>{t('clear_all')}</button>
        </div>
      )}

      {loading && query.trim() ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
           <div className="loading-spinner" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' }}>
          {displayList.length > 0 ? displayList.map(user => (
            <motion.div 
              key={user._id || user.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                onUserClick(user);
                api.post('/users/search-history', { userId: user._id }).catch(console.error);
              }} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
                background: 'rgba(255,255,255,0.03)', borderRadius: '24px', cursor: 'pointer', 
                position: 'relative', border: '1px solid rgba(255,255,255,0.05)',
                transition: 'background 0.2s'
              }}
              whileHover={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=111&color=fff`} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{user.fullName}</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>@{user.username}</p>
              </div>
              {!query.trim() && (
                <button onClick={(e) => removeHistoryItem(user._id, e)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                  <X size={18} />
                </button>
              )}
              <ChevronLeft size={20} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
            </motion.div>
          )) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
               <SearchIcon size={64} style={{ marginBottom: '16px', opacity: 0.2 }} />
               <p style={{ color: 'var(--text-secondary)' }}>{query.trim() ? t('no_results') : t('no_history')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchTab;
