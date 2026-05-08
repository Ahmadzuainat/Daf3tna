import GameSession from '../models/GameSession.js';
import crypto from 'crypto';

// Generate a random 5-character alphanumeric code
const generateRoomCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
};

export const createGame = async (req, res) => {
  const { gameType } = req.body;
  const { _id: userId, batchId } = req.user;

  try {
    let roomCode = generateRoomCode();
    // Ensure uniqueness
    while (await GameSession.findOne({ roomCode, status: { $ne: 'finished' } })) {
      roomCode = generateRoomCode();
    }

    const game = await GameSession.create({
      gameType,
      roomCode,
      batchId,
      players: [{ user: userId, symbol: gameType === 'tictactoe' ? 'X' : 'white', isReady: true }],
      status: 'waiting',
      gameState: gameType === 'tictactoe' ? { board: Array(9).fill(null) } : {}
    });

    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const joinGame = async (req, res) => {
  const { roomCode } = req.body;
  const { _id: userId } = req.user;

  try {
    const game = await GameSession.findOne({ roomCode, status: 'waiting' })
      .populate('players.user', 'fullName avatarUrl');

    if (!game) {
      return res.status(404).json({ message: 'الغرفة غير موجودة أو بدأت اللعبة بالفعل' });
    }

    // Check if user is already in the game
    const isPlayerIn = game.players.find(p => p.user._id.toString() === userId.toString());
    if (isPlayerIn) return res.json(game);

    if (game.players.length >= 2) {
      return res.status(400).json({ message: 'الغرفة ممتلئة' });
    }

    game.players.push({ 
      user: userId, 
      symbol: game.gameType === 'tictactoe' ? 'O' : 'black',
      isReady: true 
    });

    // Start the game if 2 players joined
    if (game.players.length === 2) {
      game.status = 'playing';
      game.currentTurn = game.players[0].user; // Player 1 starts
    }

    await game.save();
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGameStatus = async (req, res) => {
  try {
    const game = await GameSession.findOne({ roomCode: req.params.roomCode })
      .populate('players.user', 'fullName avatarUrl')
      .populate('winner', 'fullName')
      .populate('currentTurn', 'fullName');
    
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
