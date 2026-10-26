'use client';

import React, { useEffect, useCallback } from 'react';
import { ChevronRight, Award, Compass } from 'lucide-react';
import { LEVELS } from '../../game/data/levels';
import { ProtocolButton } from '../ui/ProtocolButton';
import { SeamSigil } from '../ui/Seam';

interface LevelTransitionScreenProps {
  currentLevel: number;
  nextLevel: number;
  storyLines: string[];
  onProceed: () => void;
}

/**
 * Modal-less Cinematic Realm Transition Screen.
 *
 * Removes the heavy rectangular box so that G-One (left) and Ra-One (right)
 * remain 100% visible and unblocked. Titles and fragment status float cinematically
 * at the top, while the destination and continue trigger dock cleanly at the bottom.
 */
export const LevelTransitionScreen: React.FC<LevelTransitionScreenProps> = ({
  currentLevel,
  nextLevel,
  storyLines,
  onProceed,
}) => {
  const nextConfig = LEVELS[nextLevel];
  const nextName = nextConfig?.name ?? 'NEXT REALM';
  const nextSubtitle = nextConfig?.subtitle ?? '';

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.code === 'Space' ||
        e.code === 'Enter' ||
        e.key === ' ' ||
        e.key === 'Enter' ||
        e.code === 'KeyE' ||
        e.key === 'e' ||
        e.key === 'E'
      ) {
        e.preventDefault();
        onProceed();
      }
    },
    [onProceed]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [handleKey]);

  // Use the most direct, actionable briefing line to keep the screen punchy
  const directiveText =
    storyLines.length > 0 ? storyLines[storyLines.length - 1] : '';

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-fade-in cursor-pointer bg-[#050811]"
      onClick={onProceed}
      role="dialog"
      aria-label={`Realm ${currentLevel} Cleared`}
    >
      {/* 1. Full-viewport cinematic background — 100% edge-to-edge coverage */}
      <img
        src="/images/gameplay.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-[center_15%] z-0 select-none pointer-events-none"
      />

      {/* 2. Atmospheric vignettes — preserves open, crisp clarity in center where characters stand */}
      <div className="absolute inset-x-0 top-0 h-44 sm:h-52 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-48 sm:h-56 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,8,17,0.3)_100%)] pointer-events-none z-10" />

      {/* 3. Upper Cinematic Title Area — Floats seamlessly with no box or borders */}
      <div
        className="relative z-20 flex flex-col items-center text-center gap-2 sm:gap-3 pt-2 sm:pt-6 animate-rise-in pointer-events-none"
      >
        <SeamSigil size={28} />

        <h1
          className="font-display font-black text-3xl sm:text-5xl md:text-6xl tracking-[0.16em] uppercase text-[#00F0FF]"
          style={{
            textShadow:
              '0 0 35px rgba(0, 240, 255, 0.9), 0 0 70px rgba(0, 180, 255, 0.5), 0 4px 16px rgba(0, 0, 0, 0.95)',
          }}
        >
          Realm {currentLevel} Cleared
        </h1>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/40 rounded-full backdrop-blur-sm shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-ui text-xs font-bold tracking-[0.2em] uppercase text-amber-400">
            Protocol Fragment Acquired
          </span>
        </div>

        {directiveText && (
          <p
            className="font-body text-xs sm:text-sm text-paper/90 tracking-wide max-w-lg mt-1 px-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            {directiveText}
          </p>
        )}
      </div>

      {/* 4. Bottom Cinematic Control Dock — Action button & Destination docked along bottom */}
      <div
        className="relative z-20 flex flex-col items-center justify-center pb-2 sm:pb-6 gap-2 sm:gap-3 animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Next destination pill */}
        <div className="flex flex-col items-center text-center gap-0.5">
          <div className="inline-flex items-center gap-1.5 text-muted drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            <Compass className="w-3.5 h-3.5 text-order-ice" />
            <span className="font-ui text-[0.65rem] tracking-[0.24em] uppercase text-order-ice">
              Next Destination
            </span>
          </div>
          <span className="font-display text-xl sm:text-2xl font-black text-white tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            {nextName}
          </span>
          {nextSubtitle && (
            <span className="font-ui text-xs text-order-ice/90 tracking-widest drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {nextSubtitle}
            </span>
          )}
        </div>

        {/* Primary Continue Button */}
        <div className="w-full max-w-md flex flex-col items-center gap-2 mt-1">
          <ProtocolButton
            variant="order"
            size="lg"
            onClick={onProceed}
            trailing={<ChevronRight className="w-5 h-5" />}
            className="w-full shadow-[0_0_30px_rgba(0,240,255,0.4)]"
          >
            Enter {nextName}
          </ProtocolButton>

          <span className="font-ui text-[0.65rem] tracking-[0.24em] text-paper/70 uppercase animate-pulse drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
            [ Press Space / Enter or Click Anywhere to Continue ]
          </span>
        </div>
      </div>
    </div>
  );
};
