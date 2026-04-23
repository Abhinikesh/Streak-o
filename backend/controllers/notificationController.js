import webpush from 'web-push';
import User from '../models/User.js';
import PushSubscription from '../models/PushSubscription.js';

// ── Initialize VAPID ──────────────────────────────────────────────────────────
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:admin@streakboard.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.error('[Notifications] ⚠️  VAPID keys missing from .env — push notifications disabled.');
}

// ── GET /api/notifications/vapid-public-key  (public, no auth) ───────────────
export const getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
};

// ── POST /api/notifications/subscribe  (protected) ───────────────────────────
export const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Missing subscription fields' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: req.user.id, endpoint, keys },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error('subscribe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE /api/notifications/unsubscribe  (protected) ───────────────────────
export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ endpoint, userId: req.user.id });
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    console.error('unsubscribe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/notifications/settings  (protected) ─────────────────────────────
// Reads the persisted reminderEnabled + reminderTime from DB on page load.
export const getReminderSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('reminderEnabled reminderTime');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      reminderEnabled: user.reminderEnabled ?? false,
      reminderTime:    user.reminderTime    ?? '21:00',
    });
  } catch (err) {
    console.error('getReminderSettings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PATCH /api/notifications/settings  (protected) ───────────────────────────
export const updateReminderSettings = async (req, res) => {
  try {
    const { reminderEnabled, reminderTime } = req.body;

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (reminderTime !== undefined && !timeRegex.test(reminderTime)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM (24h)' });
    }

    const update = {};
    if (reminderEnabled !== undefined) update.reminderEnabled = reminderEnabled;
    if (reminderTime   !== undefined) update.reminderTime     = reminderTime;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, select: 'reminderEnabled reminderTime' }
    );

    res.json({
      reminderEnabled: updatedUser.reminderEnabled,
      reminderTime:    updatedUser.reminderTime,
    });
  } catch (err) {
    console.error('updateReminderSettings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
