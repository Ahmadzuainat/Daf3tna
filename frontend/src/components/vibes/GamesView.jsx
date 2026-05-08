import React, { useState } from 'react';
import { ArrowRight, Trophy, Users, Monitor, Gamepad2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TicTacToe from '../games/TicTacToe';
import ChessGame from '../games/Chess';
// import Ludo from '../games/Ludo';

const GamesView = ({ onBack }) => {
  const [selectedGame, setSelectedGame] = useState(null);

  const games = [
    { 
      id: 'tictactoe', 
      title: 'Tic Tac Toe (X O)', 
      desc: 'لعبة التحدي الكلاسيكية السريعة', 
      icon: Gamepad2, 
      color: 'linear-gradient(135deg, #3B82F6, #1E3A8A)',
      component: TicTacToe
    },
    { 
      id: 'chess', 
      title: 'شطرنج (Chess)', 
      desc: 'تحدى ذكاء أصدقائك في معركة الملوك', 
      icon: Trophy, 
      color: 'linear-gradient(135deg, #10B981, #065F46)',
      component: ChessGame
    },
    { 
      id: 'ludo', 
      title: 'لودو (Ludo)', 
      desc: 'لعبة الحظ والذكاء الجماعية', 
      icon: Users, 
      color: 'linear-gradient(135deg, #F59E0B, #B45309)',
      component: null // To be added
    }
  ];

  if (selectedGame) {
    const GameComp = games.find(g => g.id === selectedGame).component;
    if (GameComp) {
      return <GameComp onBack={() => setSelectedGame(null)} />;
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ArrowRight size={32} color="white" onClick={onBack} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '4px' }} />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>الألعاب الجماعية 🎮</h2>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => game.component && setSelectedGame(game.id)}
            style={{
              background: game.color,
              borderRadius: '24px',
              padding: '24px',
              cursor: game.component ? 'pointer' : 'not-allowed',
              opacity: game.component ? 1 : 0.6,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
            whileHover={game.component ? { scale: 1.02 } : {}}
          >
            <div style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }}>
              <game.icon size={150} color="white" />
            </div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '8px' }}>{game.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '16px' }}>{game.desc}</p>
              
              {!game.component && (
                <span style={{ background: 'rgba(0,0,0,0.3)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>قريباً...</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GamesView;
