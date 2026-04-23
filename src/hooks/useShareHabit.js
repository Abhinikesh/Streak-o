import { useState } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export default function useShareHabit() {
  const [isCapturing, setIsCapturing] = useState(false);

  const shareHabit = async (cardRef, habitName) => {
    if (!cardRef?.current) return;
    setIsCapturing(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      const fileName = `${(habitName || 'habit').replace(/\s+/g, '-')}-streak.png`;

      // ── Mobile: Web Share API ───────────────────────────────────────────────
      if (
        navigator.share &&
        navigator.canShare &&
        blob
      ) {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${habitName} streak`,
              text: 'Check out my StreakBoard habit progress! 🔥',
            });
            toast.success('Share card saved! 🎉');
            return;
          } catch (shareErr) {
            // User cancelled or share not supported — fall through to download
            if (shareErr?.name === 'AbortError') {
              return; // user cancelled — no error toast
            }
          }
        }
      }

      // ── Desktop / fallback: trigger download ────────────────────────────────
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Share card saved! 🎉');
    } catch (err) {
      console.error('useShareHabit error:', err);
      toast.error('Failed to generate image');
    } finally {
      setIsCapturing(false);
    }
  };

  return { shareHabit, isCapturing };
}
