import confetti from 'canvas-confetti';

export const fireConfetti = () => {
  // Left burst
  confetti({
    particleCount: 80,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.7 },
    colors: ['#4F46E5', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6'],
  });
  // Right burst
  confetti({
    particleCount: 80,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.7 },
    colors: ['#4F46E5', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6'],
  });
  // Center shower after 300ms
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#4F46E5', '#22C55E', '#F59E0B'],
      scalar: 1.2,
    });
  }, 300);
};

export const fireSmallConfetti = () => {
  confetti({
    particleCount: 30,
    spread: 60,
    origin: { x: 0.5, y: 0.6 },
    colors: ['#4F46E5', '#22C55E', '#F59E0B'],
    scalar: 0.8,
  });
};
