
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`relative group cursor-pointer transition-all duration-500 ${sizeClasses[size]} ${className}`}>
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-transform duration-500 group-hover:scale-110"
      >
        {/* Circle Backdrop */}
        <circle cx="50" cy="50" r="45" fill="url(#bgGradient)" className="opacity-80" />
        
        {/* Mountain Silhouette */}
        <path
          d="M15 65 L35 45 L50 60 L75 35 L90 65"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* The Tent */}
        <path
          d="M25 75 L50 30 L75 75 Z"
          className="fill-indigo-600/40 stroke-purple-400"
          strokeWidth="3"
        />
        <path
          d="M50 30 L50 75"
          className="stroke-purple-400/50"
          strokeWidth="2"
        />
        <path
          d="M40 75 L50 55 L60 75"
          className="fill-purple-900/60 stroke-purple-400/80"
          strokeWidth="2"
        />

        {/* The Living Campfire */}
        <g className="animate-flicker">
          <path
            d="M45 75 Q50 60 55 75"
            className="fill-orange-500 blur-[1px]"
          />
          <path
            d="M48 75 Q50 65 52 75"
            className="fill-yellow-400"
          />
        </g>

        {/* Definitions */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          
          <style>{`
            @keyframes flicker {
              0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.9; }
              50% { transform: scaleY(1.3) translateY(-2px); opacity: 1; filter: brightness(1.2); }
              25% { transform: scaleY(0.8) skewX(2deg); }
              75% { transform: scaleY(1.1) skewX(-2deg); }
            }
            .animate-flicker {
              transform-origin: 50px 75px;
              animation: flicker 0.6s infinite ease-in-out;
            }
          `}</style>
        </defs>
      </svg>
    </div>
  );
};

export default Logo;
