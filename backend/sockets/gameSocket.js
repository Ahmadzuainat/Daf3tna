import GameSession from '../models/GameSession.js';
import { Chess } from 'chess.js';

const registerGameHandlers = (io, socket) => {
  
  socket.on('game:joinRoom', async ({ roomCode }) => {
    try {
      if (!roomCode) return;
      const roomName = `game_${roomCode.toUpperCase()}`;
      
      const game = await GameSession.findOne({ roomCode: roomCode.toUpperCase() })
        .populate('players.user', 'fullName profilePicture');
      
      if (!game) {
        console.log(`❌ Room ${roomCode} not found for user ${socket.userId}`);
        return socket.emit('game:error', { message: 'الغرفة غير موجودة' });
      }

      socket.join(roomName);
      console.log(`🔌 Socket ${socket.id} (User: ${socket.userId}) joined room: ${roomName}`);
      
      // Update player socket ID in the session
      const playerIndex = game.players.findIndex(p => p.user?._id?.toString() === socket.userId);
      if (playerIndex !== -1) {
        game.players[playerIndex].socketId = socket.id;
        await game.save();
      }

      // Populate again to be sure
      const populatedGame = await GameSession.findById(game._id)
        .populate('players.user', 'fullName profilePicture')
        .populate('currentTurn', 'fullName profilePicture');

      // BROADCAST TO EVERYONE IN THE ROOM
      io.to(roomName).emit('game:updated', populatedGame);
      console.log(`📢 Broadcasted update to room: ${roomName}`);
    } catch (error) {
      console.error('Join room error:', error);
    }
  });

  socket.on('game:move', async ({ roomCode, move }) => {
    try {
      const game = await GameSession.findOne({ roomCode, status: 'playing' });
      if (!game) return;

      // Validate turn - Robust string comparison
      const currentTurnId = game.currentTurn ? game.currentTurn.toString() : null;
      const socketUserId = socket.userId ? socket.userId.toString() : null;

      if (currentTurnId !== socketUserId) {
        console.log(`🚫 Turn mismatch: Current=${currentTurnId}, Socket=${socketUserId}`);
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
        const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        let currentFen = game.gameState.fen;
        if (!currentFen || currentFen === 'start') currentFen = startFen;
        const chess = new Chess(currentFen);
        
        try {
          const result = chess.move(move); // move example: { from: 'e2', to: 'e4' }
          if (result) {
            console.log(`✅ Move Valid in ${roomCode}: ${move.from}->${move.to}`);
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

      // Update the database atomically
      await GameSession.findOneAndUpdate(
        { roomCode, status: 'playing' },
        { 
          $set: { 
            gameState: game.gameState,
            currentTurn: game.currentTurn,
            status: game.status,
            winner: game.winner
          },
          $push: { history: { move, playedBy: socket.userId } }
        }
      );

      // Fetch fully populated game to broadcast
      const updatedGame = await GameSession.findOne({ roomCode })
        .populate('players.user', 'fullName profilePicture')
        .populate('currentTurn', 'fullName profilePicture')
        .populate('winner', 'fullName profilePicture');
        
      if (updatedGame) {
        io.to(`game_${roomCode}`).emit('game:updated', updatedGame);

        if (updatedGame.status === 'finished') {
          io.to(`game_${roomCode}`).emit('game:over', { 
            winner: updatedGame.winner,
            reason: updatedGame.gameType === 'chess' ? 'Checkmate' : 'Win'
          });
        }
      }
    } catch (error) {
      console.error('Game move error:', error);
      socket.emit('game:error', { message: 'حدث خطأ أثناء تنفيذ النقلة' });
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
