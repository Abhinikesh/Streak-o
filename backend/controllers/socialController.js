import User from '../models/User.js';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import { generateShareCode } from '../utils/generateShareCode.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── POST /api/social/enable ────────────────────────────────────
export const enableSharing = async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.shareCode) {
      let code;
      let attempts = 0;
      do {
        code = generateShareCode(user.name || user.email);
        attempts++;
      } while (attempts < 10 && (await User.exists({ shareCode: code })));
      user.shareCode = code;
    }
    user.isProfilePublic = true;
    await user.save();

    return res.status(200).json({
      shareCode: user.shareCode,
      shareUrl: `${CLIENT_URL}/u/${user.shareCode}`,
    });
  } catch (err) {
    console.error('[enableSharing]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/social/disable ───────────────────────────────────
export const disableSharing = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isProfilePublic: false });
    return res.status(200).json({ message: 'Profile hidden' });
  } catch (err) {
    console.error('[disableSharing]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/social/my-share ───────────────────────────────────
export const getMyShareInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('shareCode isProfilePublic name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({
      shareCode: user.shareCode || null,
      isProfilePublic: user.isProfilePublic,
      shareUrl: user.shareCode ? `${CLIENT_URL}/u/${user.shareCode}` : null,
    });
  } catch (err) {
    console.error('[getMyShareInfo]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/social/u/:shareCode (PUBLIC) ─────────────────────
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ shareCode: req.params.shareCode, isProfilePublic: true })
      .select('name avatar createdAt shareCode');
    if (!user) return res.status(404).json({ message: 'Profile not found or private' });

    const habits = await Habit.find({ userId: user._id, isActive: { $ne: false } })
      .select('name icon colorHex trackingPeriod startDate');
    const rawLogs = await HabitLog.find({ userId: user._id })
      .select('habitId date status -note').sort({ date: -1 });

    // Calculate stats
    const doneLogs = rawLogs.filter(l => l.status === 'done');
    const totalDone = doneLogs.length;
    const totalLogged = rawLogs.length;
    const overallRate = totalLogged > 0 ? Math.round((totalDone / totalLogged) * 100) : 0;

    // Current streak per habit, find max
    let longestStreak = 0;
    let currentStreaks = 0;
    const today = new Date().toISOString().split('T')[0];
    habits.forEach(habit => {
      const hLogs = rawLogs.filter(l => l.habitId.toString() === habit._id.toString() && l.status === 'done')
        .map(l => l.date).sort((a, b) => b.localeCompare(a));
      let streak = 0;
      let cur = new Date(today);
      for (const date of hLogs) {
        const d = cur.toISOString().split('T')[0];
        if (date === d) { streak++; cur.setDate(cur.getDate() - 1); }
        else break;
      }
      currentStreaks += streak;
      if (streak > longestStreak) longestStreak = streak;
    });

    const activeDates = new Set(doneLogs.map(l => l.date));

    return res.status(200).json({
      name: user.name,
      avatar: user.avatar,
      memberSince: user.createdAt,
      habits,
      logs: rawLogs.map(l => ({ habitId: l.habitId, date: l.date, status: l.status })),
      stats: { totalDone, overallRate, longestStreak, daysActive: activeDates.size },
    });
  } catch (err) {
    console.error('[getPublicProfile]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/social/friends/add ──────────────────────────────
export const addFriend = async (req, res) => {
  try {
    const { shareCode } = req.body;
    if (!shareCode) return res.status(400).json({ message: 'shareCode is required' });

    const friend = await User.findOne({ shareCode, isProfilePublic: true })
      .select('_id name shareCode');
    if (!friend) return res.status(404).json({ message: 'User not found or profile is private' });
    if (friend._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot add yourself' });
    }

    await User.findByIdAndUpdate(req.user.id, { $addToSet: { friends: friend._id } });
    return res.status(200).json({ message: 'Friend added', friend: { name: friend.name, shareCode: friend.shareCode } });
  } catch (err) {
    console.error('[addFriend]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/social/friends ────────────────────────────────────
export const getFriends = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select('friends');
    if (!me) return res.status(404).json({ message: 'User not found' });

    const friends = await User.find({ _id: { $in: me.friends } })
      .select('name avatar shareCode isProfilePublic');

    const today = new Date().toISOString().split('T')[0];
    const friendsWithData = await Promise.all(friends.map(async (f) => {
      const habitCount = await Habit.countDocuments({ userId: f._id });
      const todayDone = await HabitLog.countDocuments({ userId: f._id, date: today, status: 'done' });
      const weekStart = (() => {
        const d = new Date(); d.setHours(0,0,0,0);
        const dow = d.getDay();
        d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
        return d.toISOString().split('T')[0];
      })();
      const weekDone = await HabitLog.countDocuments({ userId: f._id, date: { $gte: weekStart }, status: 'done' });
      return { _id: f._id, name: f.name, avatar: f.avatar, shareCode: f.shareCode, isPublic: f.isProfilePublic, habitCount, todayDone, weekDone };
    }));

    return res.status(200).json(friendsWithData);
  } catch (err) {
    console.error('[getFriends]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE /api/social/friends/:shareCode ─────────────────────
export const removeFriend = async (req, res) => {
  try {
    const friend = await User.findOne({ shareCode: req.params.shareCode }).select('_id');
    if (!friend) return res.status(404).json({ message: 'User not found' });
    await User.findByIdAndUpdate(req.user.id, { $pull: { friends: friend._id } });
    return res.status(200).json({ message: 'Friend removed' });
  } catch (err) {
    console.error('[removeFriend]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
