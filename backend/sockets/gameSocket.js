import GameSession from '../models/GameSession.js';

const registerGameHandlers = (io, socket) => {
  
  socket.on('game:joinRoom', async ({ roomCode }) => {
    socket.join(`game_${roomCode}`);
    console.log(`🎮 User ${socket.userId} joined game room: ${roomCode}`);
    
    // Notify others in the room
    socket.to(`game_${roomCode}`).emit('game:playerJoined', { userId: socket.userId });
  });

  socket.on('game:move', async ({ roomCode, move }) => {
    try {
      const game = await GameSession.findOne({ roomCode, status: 'playing' });
      if (!game) return;

      // Validate turn
      if (game.currentTurn.toString() !== socket.userId) {
        return socket.emit('game:error', { message: 'ليس دورك حالياً' });
      }

      // Logic for TicTacToe
      if (game.gameType === 'tictactoe') {
        const { index } = move; // index 0-8
        if (game.gameState.board[index] !== null) return;

        const player = game.players.find(p => p.user.toString() === socket.userId);
        game.gameState.board[index] = player.symbol;
        
        // Winner detection logic could go here or in a helper
        const winner = checkTicTacToeWinner(game.gameState.board);
        if (winner) {
          game.status = 'finished';
          game.winner = socket.userId;
        } else if (!game.gameState.board.includes(null)) {
          game.status = 'finished'; // Draw
        } else {
          // Switch turn
          const otherPlayer = game.players.find(p => p.user.toString() !== socket.userId);
          game.currentTurn = otherPlayer.user;
        }
      }

      // Logic for Chess/Ludo will be added in steps

      game.markModified('gameState');
      await game.save();

      // Emit updated state to room
      const updatedGame = await GameSession.findOne({ roomCode })
        .populate('players.user', 'fullName avatarUrl')
        .populate('currentTurn', 'fullName')
        .populate('winner', 'fullName');
        
      io.to(`game_${roomCode}`).emit('game:updated', updatedGame);

      if (game.status === 'finished') {
        io.to(`game_${roomCode}`).emit('game:over', { winner: game.winner });
      }

    } catch (error) {
      console.error('Game move error:', error);
    }
  });

  socket.on('game:leave', ({ roomCode }) => {
    socket.leave(`game_${roomCode}`);
  });
};

const checkTicTacToeWinner = (board) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diags
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
