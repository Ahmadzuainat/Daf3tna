import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw, Users, Monitor, Send, Trophy, X, Circle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';
import api from '../../services/api';

const TicTacToe = ({ onBack }) => {
  const { user } = useAuthStore();
  const { socket } = useAppStore();
  
  const [mode, setMode] = useState(null); // 'ai' or 'friend'
  const [game, setGame] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (updatedGame) => {
      setGame(updatedGame);
    };

    const handleError = ({ message }) => {
      toast.error(message);
    };

    socket.on('game:updated', handleUpdate);
    socket.on('game:error', handleError);

    return () => {
      socket.off('game:updated', handleUpdate);
      socket.off('game:error', handleError);
      if (game?.roomCode) {
        socket.emit('game:leave', { roomCode: game.roomCode });
      }
    };
  }, [socket, game?.roomCode]);

  const createRoom = async () => {
    setLoading(true);
    try {
      const res = await api.post('/games/create', { gameType: 'tictactoe' });
      setGame(res.data);
      setRoomCode(res.data.roomCode);
      socket.emit('game:joinRoom', { roomCode: res.data.roomCode });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'فشل إنشاء الغرفة - تأكد من اتصال الإنترنت';
      toast.error(errorMsg);
      console.error('Create room error:', err);
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

  const handleMove = (index) => {
    if (mode === 'friend') {
      if (game.status !== 'playing') return;
      if (game.currentTurn._id !== user._id) {
        toast.error('ليس دورك حالياً');
        return;
      }
      socket.emit('game:move', { roomCode: game.roomCode, move: { index } });
    } else {
      // AI Logic (Simple for now)
      handleAIMove(index);
    }
  };

  const [aiBoard, setAiBoard] = useState(Array(9).fill(null));
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiWinner, setAiWinner] = useState(null);

  const handleAIMove = (index) => {
    if (aiBoard[index] || aiWinner || isAiThinking) return;
    
    // 1. User Move (X) - Update state immediately
    const updatedBoard = [...aiBoard];
    updatedBoard[index] = 'X';
    setAiBoard(updatedBoard);
    
    const win = checkWinner(updatedBoard);
    if (win) {
      setAiWinner(win);
      return;
    }

    if (!updatedBoard.includes(null)) {
      setAiWinner('draw');
      return;
    }

    // 2. AI Turn (O) - Use the updatedBoard directly
    setIsAiThinking(true);
    setTimeout(() => {
      const emptyIndices = updatedBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
      if (emptyIndices.length > 0) {
        const aiIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        updatedBoard[aiIndex] = 'O';
        
        // Update state with the final board after AI move
        setAiBoard([...updatedBoard]);
        
        const winO = checkWinner(updatedBoard);
        if (winO) setAiWinner(winO);
      }
      setIsAiThinking(false);
    }, 600);
  };

  const checkWinner = (board) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let [a,b,c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return null;
  };

  const renderBoard = () => {
    const board = mode === 'friend' ? game?.gameState?.board : aiBoard;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%', maxWidth: '350px', margin: '0 auto' }}>
        {board?.map((cell, i) => (
          <div 
            key={i} 
            onClick={() => handleMove(i)}
            style={{ 
              aspectRatio: '1/1', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: cell ? 'default' : 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '2.5rem'
            }}
          >
            {cell === 'X' && <X size={48} color="#3B82F6" strokeWidth={3} />}
            {cell === 'O' && <Circle size={40} color="#EF4444" strokeWidth={3} />}
          </div>
        ))}
      </div>
    );
  };

  if (!mode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <header style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ArrowRight size={32} color="white" onClick={onBack} style={{ cursor: 'pointer' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Tic Tac Toe</h2>
        </header>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
          <button 
            onClick={() => setMode('ai')}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          >
            <div style={{ background: '#3B82F6', padding: '12px', borderRadius: '16px' }}><Monitor size={24} /></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>اللعب ضد الكمبيوتر</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>تحدى الذكاء الاصطناعي</div>
            </div>
          </button>

          <button 
            onClick={() => setMode('friend')}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          >
            <div style={{ background: '#8B5CF6', padding: '12px', borderRadius: '16px' }}><Users size={24} /></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>اللعب مع صديق</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>تحدى صديقك في الوقت الفعلي</div>
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
          <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '32px' }}>اللعب مع صديق</h2>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '32px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              onClick={createRoom}
              disabled={loading}
              style={{ width: '100%', background: '#3B82F6', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 'bold', marginBottom: '24px', cursor: 'pointer' }}
            >
              أنشئ غرفة جديدة
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ArrowRight size={32} color="white" onClick={() => setMode(null)} style={{ cursor: 'pointer' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontWeight: 'bold' }}>Tic Tac Toe</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{mode === 'ai' ? 'ضد الكمبيوتر' : 'لعب جماعي'}</div>
        </div>
        <div style={{ width: '32px' }} />
      </header>

      {mode === 'friend' && game?.status === 'waiting' && (
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ color: 'white', marginBottom: '16px' }}>بانتظار الصديق...</h3>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px', border: '1px solid #3B82F6', display: 'inline-block', margin: '0 auto' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '8px' }}>رمز الغرفة</div>
            <div style={{ color: '#3B82F6', fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '4px' }}>{game.roomCode}</div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '24px' }}>شارك هذا الرمز مع صديقك ليبدأ التحدي</p>
        </div>
      )}

      {(mode === 'ai' || (game && game.status !== 'waiting')) && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Player Indicators */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '350px', marginBottom: '40px' }}>
             <div style={{ 
               textAlign: 'center', padding: '12px', borderRadius: '16px', 
               border: (mode === 'friend' ? game.currentTurn._id === game.players[0].user._id : !isAiThinking) ? '2px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)', 
               background: 'rgba(255,255,255,0.05)', minWidth: '100px' 
             }}>
                <div style={{ color: '#3B82F6', fontWeight: 'bold' }}>X</div>
                <div style={{ color: 'white', fontSize: '0.8rem' }}>{mode === 'ai' ? 'أنت' : game.players[0].user.fullName.split(' ')[0]}</div>
                {mode === 'ai' && !isAiThinking && !aiWinner && <div style={{ fontSize: '0.6rem', color: '#3B82F6', marginTop: '4px' }}>دورك</div>}
             </div>
             <div style={{ 
               textAlign: 'center', padding: '12px', borderRadius: '16px', 
               border: (mode === 'friend' ? game.currentTurn._id === game.players[1]?.user?._id : isAiThinking) ? '2px solid #EF4444' : '1px solid rgba(255,255,255,0.1)', 
               background: 'rgba(255,255,255,0.05)', minWidth: '100px' 
             }}>
                <div style={{ color: '#EF4444', fontWeight: 'bold' }}>O</div>
                <div style={{ color: 'white', fontSize: '0.8rem' }}>{mode === 'ai' ? 'الكمبيوتر' : game.players[1]?.user?.fullName?.split(' ')[0]}</div>
                {mode === 'ai' && isAiThinking && <div style={{ fontSize: '0.6rem', color: '#EF4444', marginTop: '4px' }}>يفكر...</div>}
             </div>
          </div>

          {renderBoard()}

          {/* Winner Display */}
          {(aiWinner || (game?.status === 'finished')) && (
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <Trophy size={48} color="#F59E0B" style={{ marginBottom: '16px' }} />
              <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {mode === 'ai' ? (aiWinner === 'draw' ? 'تعادل!' : (aiWinner === 'X' ? 'لقد فزت! 🎉' : 'خسرت! 🤖')) : (game.winner ? `${game.winner.fullName} فاز! 🏆` : 'تعادل!')}
              </h3>
              <button 
                onClick={() => { mode === 'ai' ? setAiBoard(Array(9).fill(null)) || setAiWinner(null) : createRoom(); }}
                style={{ marginTop: '24px', background: '#3B82F6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                العب مرة أخرى
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
