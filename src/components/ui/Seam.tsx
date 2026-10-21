'use client';

import React from 'react';

/**
 * THE DIMENSIONAL SEAM — the signature brand motif.
 *
 * A luminous fracture where the cyan Order realm meets the crimson Entropy
 * realm. Used as a composition axis on the landing screen, a divider inside
 * panels, and the focal element of the start transition.
 */

/** Horizontal cyan -> white -> crimson energy rule. */
export const SeamDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`seam-divider w-full ${className}`} aria-hidden="true" />
);

/** The diamond sigil that marks the seam's nodes. */
export const SeamSigil: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="sigil-seam" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#00CFFF" />
        <stop offset="50%" stopColor="#EAF2F7" />
        <stop offset="100%" stopColor="#FF243D" />
      </linearGradient>
    </defs>
    <path
      d="M12 1.5 20.5 12 12 22.5 3.5 12Z"
      fill="none"
      stroke="url(#sigil-seam)"
      strokeWidth="1.6"
    />
    <path d="M12 7.5 16.5 12 12 16.5 7.5 12Z" fill="url(#sigil-seam)" opacity="0.85" />
  </svg>
);

interface VerticalSeamProps {
  /** 0 = idle ambience, 1 = fully charged during the start transition. */
  intensity?: number;
  animate?: boolean;
}

/**
 * Full-height reality fracture pinned to the composition's centre axis.
 * `intensity` drives the charge-up when the player initiates the protocol.
 */
export const VerticalSeam: React.FC<VerticalSeamProps> = ({
  intensity = 0,
  animate = true,
}) => (
  <div
    className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none z-20"
    aria-hidden="true"
  >
    {/* Soft atmospheric bloom around the fracture */}
    <div
      className="absolute inset-y-0 left-1/2 -translate-x-1/2 blur-2xl transition-all duration-700"
      style={{
        width: `${60 + intensity * 340}px`,
        background:
          'linear-gradient(to bottom, transparent, rgba(0,207,255,0.30) 20%, rgba(255,255,255,0.45) 50%, rgba(255,36,61,0.30) 80%, transparent)',
        opacity: 0.35 + intensity * 0.65,
      }}
    />
    {/* The hard fracture line itself */}
    <div
      className={[
        'seam-vertical absolute inset-y-0 left-1/2 -translate-x-1/2 transition-all duration-500',
        animate ? 'animate-seam-flicker' : '',
      ].join(' ')}
      style={{
        width: `${1.5 + intensity * 26}px`,
        opacity: 0.55 + intensity * 0.45,
      }}
    />
    {/* Breathing halo — the seam is unstable, never perfectly still */}
    <div
      className={[
        'absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/70',
        animate ? 'animate-seam-pulse' : '',
      ].join(' ')}
    />
  </div>
);
