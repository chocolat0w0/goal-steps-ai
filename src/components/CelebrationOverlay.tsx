import { useMemo } from 'react';

const COLORS = ['#FDE68A', '#FCA5A5', '#BFDBFE', '#A7F3D0', '#FDBA74'];

function CelebrationOverlay() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })),
    []
  );

  return (
    <div
      data-testid="celebration-overlay"
      className="pointer-events-none fixed inset-0 overflow-hidden z-50"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default CelebrationOverlay;
