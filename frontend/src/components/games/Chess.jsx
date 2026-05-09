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
  const [chess] = useState(new Chess()); // Keep instance stable
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [orientation, setOrientation] = useState('white');
  const [isAiThinking, setIsAiThinking] = useState(false);
 
  // Sync local chess with backend state
  useEffect(() => {
    if (game?.gameState?.fen) {
      const serverFen = game.gameState.fen === 'start' 
        ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        : game.gameState.fen;
      
      const currentTurnId = game.currentTurn?._id || game.currentTurn;
      const isMyTurn = currentTurnId?.toString() === user?._id?.toString();

      // Sync if board is different AND (it's not my turn OR I haven't moved yet)
      // This prevents "snap-back" while you're dragging/dropping on your own turn.
      if (chess.fen() !== serverFen) {
        if (!isMyTurn || fen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
          chess.load(serverFen);
          setFen(chess.fen());
        }
      }
      
      // Determine orientation based on player assignment
      const me = game.players?.find(p => (p.user?._id || p.user) === user?._id);
      if (me && me.symbol) {
        setOrientation(me.symbol === 'black' ? 'black' : 'white');
      }
    }
  }, [game?.gameState?.fen, user?._id, game?.players, chess, game?.currentTurn]);

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

  const evaluateBoard = (chessInstance) => {
    const values = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
    let totalEvaluation = 0;
    const board = chessInstance.board();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const val = values[piece.type] || 0;
          totalEvaluation += (piece.color === 'w' ? val : -val);
        }
      }
    }
    return totalEvaluation;
  };

  const makeBestMove = () => {
    setIsAiThinking(true);
    setTimeout(() => {
      const moves = chess.moves({ verbose: true });
      if (chess.isGameOver() || moves.length === 0) {
        setIsAiThinking(false);
        return;
      }

      // Simple one-move lookahead (greedy)
      // For more depth, minimax could be used but might block UI without WebWorker
      let bestMove = null;
      let bestValue = Infinity; // AI is Black by default here

      for (const move of moves) {
        chess.move(move);
        const boardValue = evaluateBoard(chess);
        chess.undo();
        if (boardValue < bestValue) {
          bestValue = boardValue;
          bestMove = move;
        }
      }

      const finalMove = bestMove || moves[Math.floor(Math.random() * moves.length)];
      chess.move(finalMove);
      setFen(chess.fen());
      setIsAiThinking(false);
    }, 500);
  };

  function onDrop(sourceSquare, targetSquare) {
    const currentTurnId = game?.currentTurn?._id || game?.currentTurn;
    const userId = user?._id || user?.id;
    
    if (mode === 'friend') {
      if (!game || game.status !== 'playing') return false;
      if (currentTurnId?.toString() !== userId?.toString()) {
        toast.error('ليس دورك حالياً');
        return false;
      }
    } else if (mode === 'ai' && isAiThinking) {
      return false;
    }

    try {
      // 1. Check if move is legal locally
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;

      // 2. Update local UI state
      setFen(chess.fen());

      // 3. Inform backend
      if (mode === 'ai') {
        setTimeout(makeBestMove, 500);
      } else {
        // Emit SAN string (like 'e4') or object. 
        // SAN is more robust for chess.js history sync.
        socket.emit('game:move', { 
          roomCode: game.roomCode, 
          move: move.san 
        });
      }
      return true;
    } catch (error) {
      console.error('Chess move error:', error);
      return false;
    }
  }

  const getOpponent = () => {
    if (mode === 'ai') return { fullName: 'الكمبيوتر (AI)' };
    const opponentPlayer = game?.players?.find(p => {
      const pId = p.user?._id?.toString() || p.user?.toString();
      const uId = user?._id?.toString() || user?.id?.toString();
      return pId !== uId;
    });
    return opponentPlayer?.user || null;
  };

  if (!mode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <header style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ArrowRight size={32} color="white" onClick={onBack} style={{ cursor: 'pointer' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Chess (شطرنج)</h2>
        </header>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
          <button 
            onClick={() => setMode('ai')}
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
              {getOpponent()?.fullName || 'بانتظار الخصم...'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
              {(mode === 'ai' ? isAiThinking : (game?.currentTurn?._id?.toString() !== user?._id?.toString() && game?.currentTurn?.toString() !== user?._id?.toString())) ? 'يفكر...' : 'ينتظر...'}
            </div>
          </div>
        </div>

        {/* The Board */}
        <div style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '8px', overflow: 'hidden' }}>
          <Chessboard 
            position={fen} 
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
              {(mode === 'ai' ? !isAiThinking : (game?.currentTurn?._id?.toString() === user?._id?.toString() || game?.currentTurn?.toString() === user?._id?.toString())) ? 'دورك الآن!' : "انتظر دور الخصم"}
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
