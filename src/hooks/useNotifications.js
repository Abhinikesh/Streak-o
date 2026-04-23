import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert VAPID public key from URL-safe base64 → Uint8Array */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export default function useNotifications() {
  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager'   in window;

  const [permission,    setPermission]    = useState(
    isSupported ? Notification.permission : 'default'
  );
  const [isSubscribed,  setIsSubscribed]  = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);

  // ── Register SW + detect existing subscription on mount ──────────────────
  useEffect(() => {
    if (!isSupported) return;

    (async () => {
      try {
        // register() is idempotent — safe to call even if already registered
        await navigator.serviceWorker.register('/sw.js');
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
        setPermission(Notification.permission);
      } catch (err) {
        console.error('[useNotifications] SW registration error:', err);
      }
    })();
  }, [isSupported]);

  // ── subscribe ─────────────────────────────────────────────────────────────
  const subscribe = async () => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      // 1. Request browser permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast.error('Please allow notifications in your browser settings');
        setIsLoading(false);
        return;
      }

      // 2. Fetch VAPID public key — fails gracefully if not configured
      const { data } = await api.get('/api/notifications/vapid-public-key');
      if (!data?.publicKey) {
        toast.error('Push notifications not configured on the server yet.');
        console.error('[useNotifications] VAPID public key missing from backend .env');
        setIsLoading(false);
        return;
      }

      // 3. Register SW (idempotent) then wait until active
      await navigator.serviceWorker.register('/sw.js');
      const reg = await navigator.serviceWorker.ready;

      // 4. Subscribe via PushManager
      let subscription;
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });
      } catch (subErr) {
        console.error('[useNotifications] pushManager.subscribe failed:', subErr);
        toast.error('Browser blocked push. Try Chrome on HTTPS or Android.');
        setIsLoading(false);
        return;
      }

      // 5. Save subscription endpoint/keys to backend
      const subJSON = subscription.toJSON();
      await api.post('/api/notifications/subscribe', {
        endpoint: subJSON.endpoint,
        keys:     subJSON.keys,
      });

      // 6. Mark user as reminder-enabled in DB so cron job finds them
      //    (reminderTime is left as whatever was already saved, or the default '21:00')
      await api.patch('/api/notifications/settings', { reminderEnabled: true });

      setIsSubscribed(true);
      setPermission('granted');
      toast.success('Reminders enabled! 🔔');
    } catch (err) {
      console.error('[useNotifications] subscribe error:', err);
      toast.error(err?.response?.data?.message || 'Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // ── unsubscribe ───────────────────────────────────────────────────────────
  const unsubscribe = async () => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const reg          = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await api.delete('/api/notifications/unsubscribe', {
          data: { endpoint: subscription.endpoint },
        });
      }

      // Disable reminder flag in DB so cron job stops targeting this user
      await api.patch('/api/notifications/settings', { reminderEnabled: false });

      setIsSubscribed(false);
      toast.success('Reminders disabled');
    } catch (err) {
      console.error('[useNotifications] unsubscribe error:', err);
      toast.error('Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // ── updateSettings ────────────────────────────────────────────────────────
  // localTimeString is "HH:MM" in the USER's LOCAL timezone.
  // We convert to UTC before saving so the cron job can compare UTC times.
  const updateSettings = async (reminderEnabled, localTimeString) => {
    try {
      const [h, m]  = localTimeString.split(':').map(Number);
      const local   = new Date();
      local.setHours(h, m, 0, 0);
      const utcH    = String(local.getUTCHours()).padStart(2, '0');
      const utcM    = String(local.getUTCMinutes()).padStart(2, '0');
      const utcTime = `${utcH}:${utcM}`;

      const { data } = await api.patch('/api/notifications/settings', {
        reminderEnabled,
        reminderTime: utcTime,
      });

      return data;
    } catch (err) {
      console.error('[useNotifications] updateSettings error:', err);
      toast.error('Failed to save reminder settings');
    }
  };

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe, updateSettings };
}
