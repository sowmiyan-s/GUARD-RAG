import React from 'react';

export const BeamsBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`} aria-hidden="true">
      {/* Premium Luxury Gradient Photo Backdrop (Tenerai / Linear style) */}
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-40 mix-blend-screen transition-opacity duration-1000"
        style={{ backgroundImage: 'url("./assets/hero-gradient.jpg")' }}
      />

      {/* Atmospheric radial darkening to blend seamlessly into page body */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, transparent 20%, rgba(6, 7, 9, 0.6) 65%, #060709 100%)',
        }}
      />

      {/* Subtle organic light rays */}
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="beamA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00b91e" stopOpacity="0" />
            <stop offset="50%" stopColor="#00b91e" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#00b91e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamB" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1="-10%" y1="25%" x2="110%" y2="15%" stroke="url(#beamA)" strokeWidth="1.2" opacity="0.6" />
        <line x1="110%" y1="10%" x2="-10%" y2="80%" stroke="url(#beamB)" strokeWidth="0.8" opacity="0.4" />

        {/* Subtle geometric dot grid pattern */}
        <pattern id="dotGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill="rgba(255, 255, 255, 0.04)" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#dotGrid)" />
      </svg>
    </div>
  );
};

export default BeamsBackground;
