import React from 'react';

interface DarkVeilProps {
  className?: string;
}

export const DarkVeil: React.FC<DarkVeilProps> = ({ className = '' }) => {
  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-red-900 opacity-95" />
      <svg className="absolute inset-0 w-full h-full opacity-30">
        <defs>
          <pattern
            id="dark-veil-grid"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 100 0 L 0 0 0 100"
              fill="none"
              stroke="rgba(220, 38, 38, 0.3)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="dark-veil-glow">
            <stop offset="0%" stopColor="rgba(153, 27, 27, 0.8)" />
            <stop offset="50%" stopColor="rgba(127, 29, 29, 0.4)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#dark-veil-grid)" />
        <g className="dark-veil-glow-group">
          <ellipse
            cx="20%"
            cy="30%"
            rx="30%"
            ry="30%"
            fill="url(#dark-veil-glow)"
            className="animate-pulse-slow"
          />
          <ellipse
            cx="80%"
            cy="70%"
            rx="25%"
            ry="25%"
            fill="url(#dark-veil-glow)"
            className="animate-pulse-slow"
            style={{ animationDelay: '1s' }}
          />
        </g>
      </svg>
      <style>
        {`
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
          }
          .animate-pulse-slow {
            animation: pulse-slow 8s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};
