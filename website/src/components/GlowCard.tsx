/**
 * Mouse-tracking glow card — inspired by 21st.dev id:47373 (my/bento-grid)
 * cursor-tracking spotlight on hover, stagger-in on scroll.
 */
import React, { useRef, useState } from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(0,185,30,0.12)',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f13] transition-colors duration-300 hover:border-white/[0.14] ${className}`}
      style={{
        background: hovered
          ? `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, ${glowColor}, transparent 70%), #0f0f13`
          : '#0f0f13',
      }}
    >
      {/* Top shimmer line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: hovered
            ? `linear-gradient(90deg, transparent, ${glowColor.replace('0.12', '0.5')} ${(pos.x / (cardRef.current?.offsetWidth ?? 300)) * 100}%, transparent)`
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 50%, transparent)',
        }}
      />
      {children}
    </div>
  );
};
