import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  enableSharing,
  disableSharing,
  getMyShareInfo,
  getPublicProfile,
  addFriend,
  getFriends,
  removeFriend,
} from '../controllers/socialController.js';

const router = express.Router();

// Public — no auth
router.get('/u/:shareCode', getPublicProfile);

// Protected
router.post('/enable', authMiddleware, enableSharing);
router.post('/disable', authMiddleware, disableSharing);
router.get('/my-share', authMiddleware, getMyShareInfo);
router.post('/friends/add', authMiddleware, addFriend);
router.get('/friends', authMiddleware, getFriends);
router.delete('/friends/:shareCode', authMiddleware, removeFriend);

export default router;
