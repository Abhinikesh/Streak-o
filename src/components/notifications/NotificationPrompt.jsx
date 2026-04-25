import { useState, useEffect } from 'react';
import useNotifications from '../../hooks/useNotifications';

/**
 * NotificationPrompt
 * Friendly in-app gate shown before the browser's native permission popup.
 *
 * Props:
 *   onDismiss — called when the user clicks either button
 */
export default function NotificationPrompt({ onDismiss }) {
  const { subscribe, isSupported } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      await subscribe(); // handles its own toast + browser permission request
    } catch (err) {
      console.error('[NotificationPrompt] subscription error:', err);
    } finally {
      // Mark as permanently seen — never show this prompt again
      localStorage.setItem('notificationPromptSeen', 'true');
      onDismiss();
      setLoading(false);
    }
  };

  const handleLater = () => {
    // Snooze for 7 days — not a permanent dismissal
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('notificationPromptSnoozed', sevenDaysFromNow.toString());
    onDismiss();
  };

  // If push isn't supported in this browser, don't render anything
  if (!isSupported) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl border"
        style={{
          background:   'var(--card, #1e1e2e)',
          borderColor:  'var(--border, rgba(255,255,255,0.1))',
          padding: '28px 24px 24px',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 42, textAlign: 'center', marginBottom: 12 }}>🔔</div>

        {/* Headline */}
        <h3
          style={{
            margin: '0 0 6px',
            fontSize: 18,
            fontWeight: 700,
            textAlign: 'center',
            color: 'var(--text, #f8f8f8)',
          }}
        >
          Never Miss a Streak
        </h3>

        {/* Body */}
        <p
          style={{
            margin: '0 0 24px',
            fontSize: 14,
            lineHeight: 1.55,
            textAlign: 'center',
            color: 'var(--text-muted, #9ca3af)',
          }}
        >
          Get 3 daily nudges to keep your habits on track.
          We'll only notify you when you have pending habits — no spam.
        </p>

        {/* Allow button */}
        <button
          onClick={handleAllow}
          disabled={loading}
          style={{
            display: 'block',
            width: '100%',
            padding: '13px 0',
            marginBottom: 10,
            borderRadius: 14,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: 15,
            background: 'var(--primary, #6366f1)',
            color: '#fff',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = '1'; }}
        >
          {loading ? 'Setting up…' : '🔔 Allow Notifications'}
        </button>

        {/* Maybe Later button */}
        <button
          onClick={handleLater}
          style={{
            display: 'block',
            width: '100%',
            padding: '9px 0',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-muted, #9ca3af)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text, #f8f8f8)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #9ca3af)'; }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
