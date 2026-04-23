export const generateShareCode = (name) => {
  const base = (name || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
};
