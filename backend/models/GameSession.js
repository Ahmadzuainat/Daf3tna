import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema({
  gameType: {
    type: String,
    enum: ['tictactoe', 'chess', 'ludo'],
    required: true
  },
  roomCode: {
    type: String,
    unique: true,
    required: true
  },
  batchId: {
    type: String,
    required: false
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    symbol: String, // 'X' or 'O' for TicTacToe, 'white' or 'black' for Chess
    socketId: String,
    isReady: { type: Boolean, default: false }
  }],
  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gameState: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished', 'cancelled'],
    default: 'waiting'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  history: [{
    move: mongoose.Schema.Types.Mixed,
    playedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Index for quick lookup by room code
gameSessionSchema.index({ roomCode: 1 });

const GameSession = mongoose.model('GameSession', gameSessionSchema);
export default GameSession;
