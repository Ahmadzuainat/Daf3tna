import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, RefreshCw, Users, Monitor, Trophy } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';
import api from '../../services/api';

const ChessGame = ({ onBack }) => {
  const { user } = useAuthStore();
  const { socket } = useAppStore();
  
  const [mode, setMode] = useState(null); // 'ai' or 'friend'
  const [game, setGame] = useState(null); // Backend session
  const [chess, setChess] = useState(new Chess()); // Local chess logic
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [orientation, setOrientation] = useState('white');

  // Sync local chess with backend state
  useEffect(() => {
    if (game?.gameState?.fen) {
      try {
        const fen = game.gameState.fen === 'start' 
          ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
          : game.gameState.fen;
        setChess(new Chess(fen));
      } catch (e) {
        console.error('Chess FEN Error:', e);
        setChess(new Chess());
      }
      
      // Determine orientation
      const me = game.players?.find(p => p.user?._id === user?._id);
      if (me) setOrientation(me.symbol); // 'white' or 'black'
    }
  }, [game?.gameState?.fen, user?._id, game?.players]);

  useEffect(() => {
    if (!socket) return;

    socket.on('game:init', (data) => setGame(data));
    socket.on('game:updated', (data) => setGame(data));
    socket.on('game:playerStatus', ({ userId, status }) => {
      const p = game?.players.find(p => p.user._id === userId);
      if (p) toast.info(`${p.user.fullName} is now ${status}`);
    });
    socket.on('game:error', ({ message }) => toast.error(message));

    // Re-join room if socket reconnects
    if (game?.roomCode) {
      socket.emit('game:joinRoom', { roomCode: game.roomCode });
    }

    return () => {
      socket.off('game:init');
      socket.off('game:updated');
      socket.off('game:playerStatus');
      socket.off('game:error');
    };
  }, [socket, game?.roomCode]);

  const createRoom = async () => {
    setLoading(true);
    try {
      const res = await api.post('/games/create', { gameType: 'chess' });
      setGame(res.data);
      setRoomCode(res.data.roomCode);
      socket.emit('game:joinRoom', { roomCode: res.data.roomCode });
    } catch (err) {
      toast.error('فشل إنشاء الغرفة');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!inputCode) return;
    setLoading(true);
    try {
      const res = await api.post('/games/join', { roomCode: inputCode.toUpperCase() });
      setGame(res.data);
      socket.emit('game:joinRoom', { roomCode: res.data.roomCode });
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الانضمام للغرفة');
    } finally {
      setLoading(false);
    }
  };

  function onDrop(sourceSquare, targetSquare) {
    if (game?.status !== 'playing') return false;
    
    const currentTurnId = game.currentTurn?._id || game.currentTurn;
    const userId = user?._id || user?.id;

    if (currentTurnId?.toString() !== userId?.toString()) {
      toast.error('ليس دورك حالياً');
      return false;
    }

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to queen for simplicity
    };

    // Emit to backend to validate and update
    socket.emit('game:move', { roomCode: game.roomCode, move });
    return true;
  }

  if (!mode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <header style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ArrowRight size={32} color="white" onClick={onBack} style={{ cursor: 'pointer' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Chess (شطرنج)</h2>
        </header>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
          <button 
            onClick={() => { toast.info('AI mode coming soon!'); setMode('ai'); }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          >
            <div style={{ background: '#10B981', padding: '12px', borderRadius: '16px' }}><Monitor size={24} /></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>اللعب ضد الكمبيوتر</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>اختبر مهاراتك</div>
            </div>
          </button>

          <button 
            onClick={() => setMode('friend')}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          >
            <div style={{ background: '#8B5CF6', padding: '12px', borderRadius: '16px' }}><Users size={24} /></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>اللعب مع صديق</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>تحدي حقيقي في الوقت الفعلي</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'friend' && !game) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px 16px' }}>
        <ArrowRight size={32} color="white" onClick={() => setMode(null)} style={{ cursor: 'pointer', marginBottom: '32px' }} />
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '32px' }}>شطرنج مع صديق</h2>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '32px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              onClick={createRoom}
              disabled={loading}
              style={{ width: '100%', background: '#8B5CF6', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 'bold', marginBottom: '24px', cursor: 'pointer' }}
            >
              أنشئ غرفة شطرنج
            </button>
            
            <div style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '24px' }}>أو ادخل رمز الغرفة</div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="رمز الغرفة"
                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', outline: 'none' }}
              />
              <button 
                onClick={joinRoom}
                disabled={loading}
                style={{ background: '#10B981', color: 'white', border: 'none', padding: '0 24px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                دخول
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '16px', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ArrowRight size={32} color="white" onClick={() => setMode(null)} style={{ cursor: 'pointer' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontWeight: 'bold' }}>Chess Match</div>
          <div style={{ fontSize: '0.8rem', color: '#8B5CF6' }}>{game?.roomCode ? `Room: ${game.roomCode}` : 'AI Mode'}</div>
        </div>
        <div style={{ width: '32px' }} />
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        
        {/* Opponent Info */}
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: game?.currentTurn?._id !== user._id ? '2px solid #8B5CF6' : '1px solid transparent' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            {orientation === 'white' ? 'B' : 'W'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 'bold' }}>
              {game?.players?.find(p => p.user?._id !== user?._id)?.user?.fullName || 'بانتظار الخصم...'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
              {game?.currentTurn?._id !== user?._id ? 'يفكر...' : 'ينتظر...'}
            </div>
          </div>
        </div>

        {/* The Board */}
        <div style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '8px', overflow: 'hidden' }}>
          <Chessboard 
            position={chess.fen()} 
            onPieceDrop={onDrop} 
            boardOrientation={orientation}
            customDarkSquareStyle={{ backgroundColor: '#1e293b' }}
            customLightSquareStyle={{ backgroundColor: '#334155' }}
          />
        </div>

        {/* User Info */}
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: game?.currentTurn?._id === user._id ? '2px solid #8B5CF6' : '1px solid transparent' }}>
           <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            {orientation === 'white' ? 'W' : 'B'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 'bold' }}>أنت ({user?.fullName?.split(' ')[0] || 'لاعب'})</div>
            <div style={{ color: '#8B5CF6', fontSize: '0.7rem', fontWeight: 'bold' }}>
              {game?.currentTurn?._id === user?._id ? 'Your Turn!' : "Opponent's Turn"}
            </div>
          </div>
        </div>

        {game?.status === 'finished' && (
          <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '24px', borderRadius: '24px', border: '1px solid #8B5CF6' }}>
            <Trophy size={48} color="#F59E0B" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {game.winner?._id === user._id ? 'لقد فزت بمباراة الشطرنج! 🏆' : 'كش ملك! فاز الخصم ♟️'}
            </h3>
            <button 
              onClick={() => setMode(null)}
              style={{ marginTop: '20px', background: '#8B5CF6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              العودة للقائمة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessGame;
