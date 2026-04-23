import React, { useMemo } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert "#rrggbb" → "r, g, b" for rgba() usage */
function hexToRgb(hex = '#6366f1') {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/** Return all days in a given year-month as { day, date } objects */
function getDaysInMonth(year, month) {
  const days = [];
  const count = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= count; d++) {
    const date = new Date(year, month, d);
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const dd   = String(date.getDate()).padStart(2, '0');
    days.push({ day: d, date: `${yyyy}-${mm}-${dd}`, dow: date.getDay() });
  }
  return days;
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ShareCard({
  habitName     = 'My Habit',
  habitIcon     = '⭐',
  colorHex      = '#6366f1',
  logs          = [],
  currentStreak = 0,
  bestStreak    = 0,
  completionRate = 0,
  userName      = 'You',
  month         = 'April 2025',
  cardRef,
}) {
  const rgb = hexToRgb(colorHex);

  // Parse month string → year / month index
  const [monthName, yearStr] = month.split(' ');
  const year  = parseInt(yearStr, 10);
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const monthIndex = MONTHS.indexOf(monthName);

  const daysInMonth = useMemo(
    () => getDaysInMonth(year, monthIndex < 0 ? new Date().getMonth() : monthIndex),
    [year, monthIndex]
  );

  // Map logs to a quick lookup
  const logMap = useMemo(() => {
    const m = {};
    logs.forEach(l => { m[l.date] = l.status; });
    return m;
  }, [logs]);

  // How many blank cells before day 1 (Mon = 0)
  const firstDow = daysInMonth[0]?.dow ?? 1; // 0=Sun..6=Sat
  const blanksBefore = firstDow === 0 ? 6 : firstDow - 1; // shift to Mon-start

  // ── Styles ──────────────────────────────────────────────────────────────────

  const outer = {
    width: '420px',
    background: `linear-gradient(135deg, rgba(${rgb}, 0.08) 0%, #ffffff 60%)`,
    borderRadius: '24px',
    padding: '28px',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  const decorCircle = {
    position: 'absolute',
    top: '-40px',
    left: '-40px',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: colorHex,
    opacity: 0.08,
    pointerEvents: 'none',
  };

  const topRow = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const iconCircle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: `rgba(${rgb}, 0.15)`,
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const habitNameStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    lineHeight: 1.2,
  };

  const brandStyle = {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '2px',
  };

  const monthBadge = {
    fontSize: '13px',
    fontWeight: '600',
    color: colorHex,
    background: `rgba(${rgb}, 0.10)`,
    padding: '6px 14px',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  };

  const gridWrapper = {
    marginTop: '20px',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  };

  const dowCell = {
    fontSize: '10px',
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    padding: '2px 0',
  };

  const statsRow = {
    marginTop: '20px',
    display: 'flex',
    gap: '8px',
    justifyContent: 'space-between',
  };

  const statCard = {
    flex: 1,
    background: '#ffffff',
    borderRadius: '12px',
    padding: '10px 8px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };

  const statValue = {
    fontSize: '22px',
    fontWeight: '800',
    color: colorHex,
    lineHeight: 1,
  };

  const statLabel = {
    fontSize: '10px',
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: '4px',
  };

  const bottomRow = {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const userHandle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B7280',
  };

  const brandLogo = {
    fontSize: '12px',
    color: colorHex,
    fontWeight: '700',
  };

  return (
    <div ref={cardRef} style={outer}>
      {/* Decorative circle */}
      <div style={decorCircle} />

      {/* Top row */}
      <div style={topRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={iconCircle}>{habitIcon}</div>
          <div>
            <div style={habitNameStyle}>{habitName}</div>
            <div style={brandStyle}>StreakBoard</div>
          </div>
        </div>
        <div style={monthBadge}>{month}</div>
      </div>

      {/* Calendar grid */}
      <div style={gridWrapper}>
        {/* Day-of-week headers */}
        <div style={gridStyle}>
          {DOW_LABELS.map(d => (
            <div key={d} style={dowCell}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ ...gridStyle, marginTop: '4px' }}>
          {/* Blank spacer cells */}
          {Array.from({ length: blanksBefore }).map((_, i) => (
            <div key={`blank-${i}`} style={{ aspectRatio: '1' }} />
          ))}

          {daysInMonth.map(({ day, date }) => {
            const status = logMap[date];
            let bg    = '#F3F4F6';
            let color = '#D1D5DB';

            if (status === 'done') {
              bg    = colorHex;
              color = '#ffffff';
            } else if (status === 'missed') {
              bg    = '#FEE2E2';
              color = '#EF4444';
            }

            return (
              <div
                key={date}
                style={{
                  aspectRatio: '1',
                  borderRadius: '6px',
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '600',
                  color,
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div style={statsRow}>
        <div style={statCard}>
          <div style={statValue}>{currentStreak}</div>
          <div style={statLabel}>🔥 Current</div>
        </div>
        <div style={statCard}>
          <div style={statValue}>{bestStreak}</div>
          <div style={statLabel}>⭐ Best</div>
        </div>
        <div style={statCard}>
          <div style={statValue}>{completionRate}%</div>
          <div style={statLabel}>✅ Rate</div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={bottomRow}>
        <div style={userHandle}>@{userName}</div>
        <div style={brandLogo}>streakboard.app</div>
      </div>
    </div>
  );
}
