export default function Spinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-9 w-9 border-[3px]',
    lg: 'h-14 w-14 border-4',
  };

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[80px]">
      <div
        className={`${sizeClasses[size]} rounded-full border-indigo-600 border-t-transparent animate-spin`}
        role="status"
        aria-label="Loading…"
      />
    </div>
  );
}
