import GameSession from '../models/GameSession.js';
import { Chess } from 'chess.js';

const registerGameHandlers = (io, socket) => {
  
  socket.on('game:joinRoom', async ({ roomCode }) => {
    try {
      const game = await GameSession.findOne({ roomCode })
        .populate('players.user', 'fullName avatarUrl');
      
      if (!game) return socket.emit('game:error', { message: 'الغرفة غير موجودة' });

      socket.join(`game_${roomCode}`);
      
      // Update player socket ID in the session
      const playerIndex = game.players.findIndex(p => p.user._id.toString() === socket.userId);
      if (playerIndex !== -1) {
        game.players[playerIndex].socketId = socket.id;
        await game.save();
      }

      console.log(`🎮 User ${socket.userId} joined game room: ${roomCode}`);
      
      // Notify others in the room about join/reconnect
      socket.to(`game_${roomCode}`).emit('game:playerStatus', { 
        userId: socket.userId, 
        status: 'online' 
      });

      // Send current state to the joining user
      socket.emit('game:init', game);
    } catch (error) {
      console.error('Join room error:', error);
    }
  });

  socket.on('game:move', async ({ roomCode, move }) => {
    try {
      const game = await GameSession.findOne({ roomCode, status: 'playing' });
      if (!game) return;

      // Validate turn
      if (game.currentTurn.toString() !== socket.userId) {
        return socket.emit('game:error', { message: 'ليس دورك حالياً' });
      }

      // --- TIC TAC TOE LOGIC ---
      if (game.gameType === 'tictactoe') {
        const { index } = move;
        if (game.gameState.board[index] !== null) return;

        const player = game.players.find(p => p.user.toString() === socket.userId);
        game.gameState.board[index] = player.symbol;
        
        const winnerSymbol = checkTicTacToeWinner(game.gameState.board);
        if (winnerSymbol) {
          game.status = 'finished';
          game.winner = socket.userId;
        } else if (!game.gameState.board.includes(null)) {
          game.status = 'finished'; // Draw
        } else {
          const otherPlayer = game.players.find(p => p.user.toString() !== socket.userId);
          game.currentTurn = otherPlayer.user;
        }
      }

      // --- CHESS LOGIC ---
      if (game.gameType === 'chess') {
        const chess = new Chess(game.gameState.fen || undefined);
        
        try {
          const result = chess.move(move); // move example: { from: 'e2', to: 'e4' }
          if (result) {
            game.gameState.fen = chess.fen();
            game.history.push({ move, playedBy: socket.userId });

            if (chess.isGameOver()) {
              game.status = 'finished';
              if (chess.isCheckmate()) game.winner = socket.userId;
            } else {
              const otherPlayer = game.players.find(p => p.user.toString() !== socket.userId);
              game.currentTurn = otherPlayer.user;
            }
          } else {
            return socket.emit('game:error', { message: 'حركة غير قانونية' });
          }
        } catch (e) {
          return socket.emit('game:error', { message: 'خطأ في حركة الشطرنج' });
        }
      }

      // --- LUDO LOGIC (Simplified) ---
      if (game.gameType === 'ludo') {
        if (move.action === 'roll') {
          const diceValue = Math.floor(Math.random() * 6) + 1;
          game.gameState.lastRoll = diceValue;
          game.history.push({ move: { action: 'roll', value: diceValue }, playedBy: socket.userId });
          
          // In real Ludo, you'd check if any move is possible, 
          // here we just switch turn for simplicity in V1
          const otherPlayer = game.players.find(p => p.user.toString() !== socket.userId);
          game.currentTurn = otherPlayer.user;
        }
      }

      game.markModified('gameState');
      await game.save();

      const updatedGame = await GameSession.findOne({ roomCode })
        .populate('players.user', 'fullName avatarUrl')
        .populate('currentTurn', 'fullName')
        .populate('winner', 'fullName');
        
      io.to(`game_${roomCode}`).emit('game:updated', updatedGame);

      if (game.status === 'finished') {
        io.to(`game_${roomCode}`).emit('game:over', { 
          winner: game.winner,
          reason: game.gameType === 'chess' ? 'Checkmate' : 'Win'
        });
      }

    } catch (error) {
      console.error('Game move error:', error);
    }
  });

  socket.on('disconnecting', () => {
    // Notify all game rooms this socket is in
    for (const room of socket.rooms) {
      if (room.startsWith('game_')) {
        const roomCode = room.replace('game_', '');
        socket.to(room).emit('game:playerStatus', { 
          userId: socket.userId, 
          status: 'offline' 
        });
      }
    }
  });

  socket.on('game:leave', ({ roomCode }) => {
    socket.leave(`game_${roomCode}`);
  });
};

const checkTicTacToeWinner = (board) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

export default registerGameHandlers;
