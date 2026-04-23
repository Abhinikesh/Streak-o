import express from 'express';
import auth from '../middleware/auth.js';
import { getLeaderboard, getGlobalLeaderboard } from '../controllers/leaderboardController.js';

const router = express.Router();

// GET /api/leaderboard        → friends leaderboard (protected)
router.get('/', auth, getLeaderboard);

// GET /api/leaderboard/global → global public leaderboard (protected)
router.get('/global', auth, getGlobalLeaderboard);

export default router;
