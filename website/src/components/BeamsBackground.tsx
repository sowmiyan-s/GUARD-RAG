/**
 * Animated beams background — inspired by 21st.dev id:1637 (kokonutd/beams-background)
 * and id:25483 (jahed/beams-background). Pure CSS/SVG, zero external deps.
 */
import React from 'react';

export const BeamsBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="bg-rg" cx="50%" cy="0%" r="70%">
            <stop offset="0%" stopColor="#00b91e" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00b91e" stopOpacity="0" />
            <stop offset="45%" stopColor="#00b91e" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00b91e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00b91e" stopOpacity="0" />
            <stop offset="45%" stopColor="#00e030" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#00b91e" stopOpacity="0" />
          </linearGradient>
          <filter id="blur-sm">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Soft radial glow */}
        <rect width="100%" height="100%" fill="url(#bg-rg)" />

        {/* Beam 1 */}
        <line
          x1="-10%"
          y1="30%"
          x2="110%"
          y2="10%"
          stroke="url(#beam1)"
          strokeWidth="1.5"
          filter="url(#blur-sm)"
          opacity="0.9"
        >
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="6s" repeatCount="indefinite" />
        </line>

        {/* Beam 2 */}
        <line
          x1="-10%"
          y1="55%"
          x2="110%"
          y2="40%"
          stroke="url(#beam1)"
          strokeWidth="1"
          filter="url(#blur-sm)"
          opacity="0.5"
        >
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="8s" begin="2s" repeatCount="indefinite" />
        </line>

        {/* Beam 3 — crossing */}
        <line
          x1="110%"
          y1="20%"
          x2="-10%"
          y2="80%"
          stroke="url(#beam2)"
          strokeWidth="0.8"
          filter="url(#blur-sm)"
          opacity="0.4"
        >
          <animate attributeName="opacity" values="0.1;0.4;0.1" dur="10s" begin="1s" repeatCount="indefinite" />
        </line>

        {/* Grid pattern overlay */}
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.028)" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};
