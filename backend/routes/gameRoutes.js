import express from 'express';
import { createGame, joinGame, getGameStatus } from '../controllers/gameController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createGame);
router.post('/join', protect, joinGame);
router.get('/:roomCode', protect, getGameStatus);

export default router;
