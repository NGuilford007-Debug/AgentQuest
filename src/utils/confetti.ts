import confetti from "canvas-confetti";

export function fireCelebration() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
    });
  } catch {
    // fallback if canvas not available
  }
}

export function fireLevelUp() {
  try {
    const end = Date.now() + 1.2 * 1000;
    const colors = ["#fbbf24", "#f59e0b", "#3b82f6", "#10b981"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch {
    // ignore
  }
}
