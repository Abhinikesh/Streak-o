import User from '../models/User.js';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';

// ── Shared stat calculator ──────────────────────────────────────────────────
async function buildPersonStats(person, currentUserId) {
  const habits = await Habit.find({ userId: person._id, isActive: true });
  const logs   = await HabitLog.find({ userId: person._id });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Monday of the current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  const mondayStr = monday.toISOString().split('T')[0];

  const thisWeekDone = logs.filter(
    (l) => l.status === 'done' && l.date >= mondayStr && l.date <= todayStr
  ).length;

  const totalDone   = logs.filter((l) => l.status === 'done').length;
  const totalMissed = logs.filter((l) => l.status === 'missed').length;
  const overallRate =
    totalDone + totalMissed > 0
      ? Math.round((totalDone / (totalDone + totalMissed)) * 100)
      : 0;

  let maxCurrentStreak = 0;
  let maxBestStreak    = 0;

  habits.forEach((habit) => {
    const doneDates = logs
      .filter(
        (l) =>
          l.habitId.toString() === habit._id.toString() &&
          l.status === 'done'
      )
      .map((l) => l.date)
      .sort();

    // ── Current streak ──────────────────────────────────────────
    const doneDateSet = new Set(doneDates);
    let current   = 0;
    let checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const ds = checkDate.toISOString().split('T')[0];
      if (doneDateSet.has(ds)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (ds === todayStr) {
        // Allow today to be incomplete — skip to yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    if (current > maxCurrentStreak) maxCurrentStreak = current;

    // ── Best streak (all-time) ──────────────────────────────────
    let best = 0;
    let run  = 0;
    for (let i = 0; i < doneDates.length; i++) {
      if (i === 0) { run = 1; continue; }
      const prev = new Date(doneDates[i - 1] + 'T00:00:00');
      const curr = new Date(doneDates[i]     + 'T00:00:00');
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) { run++; } else { run = 1; }
      if (run > best) best = run;
    }
    if (run  > best) best = run;
    if (best > maxBestStreak) maxBestStreak = best;
  });

  return {
    userId:        person._id,
    name:          person.name || person.email.split('@')[0],
    avatar:        person.avatar,
    shareCode:     person.shareCode,
    isCurrentUser: person._id.toString() === currentUserId,
    habitCount:    habits.length,
    currentStreak: maxCurrentStreak,
    bestStreak:    maxBestStreak,
    thisWeekDone,
    totalDone,
    overallRate,
  };
}

// ── GET /api/leaderboard  (friends board) ──────────────────────────────────
export const getLeaderboard = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).populate('friends');
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const everyone = [currentUser, ...currentUser.friends];

    const leaderboardData = await Promise.all(
      everyone.map((person) => buildPersonStats(person, req.user.id))
    );

    res.json(leaderboardData);
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/leaderboard/global  (public profiles, top 50) ────────────────
export const getGlobalLeaderboard = async (req, res) => {
  try {
    const publicUsers = await User.find({ isProfilePublic: true }).limit(200);

    const leaderboardData = await Promise.all(
      publicUsers.map((person) => buildPersonStats(person, req.user.id))
    );

    // Sort by bestStreak descending, slice to top 50
    const sorted = leaderboardData
      .sort((a, b) => b.bestStreak - a.bestStreak)
      .slice(0, 50);

    // Strip emails — only safe fields are already returned by buildPersonStats
    res.json(sorted);
  } catch (err) {
    console.error('getGlobalLeaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
