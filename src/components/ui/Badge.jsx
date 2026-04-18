const colorMap = {
  green:  'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  blue:   'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30',
  amber:  'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  red:    'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  purple: 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30',
};

/**
 * @param {{ children: React.ReactNode, color?: 'green'|'blue'|'amber'|'red'|'purple' }} props
 */
export default function Badge({ children, color = 'blue' }) {
  const classes = colorMap[color] ?? colorMap.blue;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {children}
    </span>
  );
}
