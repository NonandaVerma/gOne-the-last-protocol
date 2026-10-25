'use client';

import React from 'react';
import { BookOpen, Home, Play, RotateCcw } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { ProtocolButton } from '../ui/ProtocolButton';
import { SeamSigil } from '../ui/Seam';

export interface EndingCopy {
  header: string;
  subtext: string;
  mainTitle: string;
  lore: string;
}

interface EndingScreenProps {
  outcome: 'victory' | 'defeat';
  copy: EndingCopy;
  /** Background art path under /public. */
  image: string;
  /** Label for the primary action — "Play Again" vs "Retry". */
  primaryLabel: string;
}

/**
 * Modal-less Cinematic Ending Screen.
 *
 * Removes the heavy box/card from the center so that Ra-One and G-One remain
 * 100% visible and unblocked. The titles float cinematically in the upper smoke,
 * and the action buttons are docked along the bottom.
 */
export const EndingScreen: React.FC<EndingScreenProps> = ({
  outcome,
  copy,
  image,
  primaryLabel,
}) => {
  const isVictory = outcome === 'victory';

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-fade-in bg-[#050811]">
      {/* 1. Full-viewport cinematic background — 100% edge-to-edge coverage */}
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-[center_15%] z-0 select-none pointer-events-none"
      />

      {/* 2. Atmospheric vignettes — preserves open, crisp clarity in center where characters stand */}
      <div className="absolute inset-x-0 top-0 h-44 sm:h-52 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-48 sm:h-56 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,8,17,0.3)_100%)] pointer-events-none z-10" />

      {/* 3. Upper Cinematic Title Area — Floats seamlessly with no box or borders */}
      <div className="relative z-20 flex flex-col items-center text-center gap-2 sm:gap-3 pt-2 sm:pt-6 animate-rise-in">
        <SeamSigil size={28} />

        <span
          className={`hud-label font-bold tracking-[0.3em] text-xs sm:text-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${
            isVictory ? 'text-order-cyan' : 'text-entropy-crimson'
          }`}
        >
          {copy.header}
        </span>

        {isVictory ? (
          <h1
            className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-[0.16em] uppercase text-[#00F0FF]"
            style={{
              textShadow:
                '0 0 35px rgba(0, 240, 255, 0.9), 0 0 70px rgba(0, 180, 255, 0.5), 0 4px 16px rgba(0, 0, 0, 0.95)',
            }}
          >
            {copy.mainTitle}
          </h1>
        ) : (
          <h1
            className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-[0.16em] uppercase text-[#FF2E4D]"
            style={{
              textShadow:
                '0 0 35px rgba(255, 46, 77, 0.95), 0 0 70px rgba(255, 20, 50, 0.6), 0 4px 16px rgba(0, 0, 0, 0.95)',
            }}
          >
            {copy.mainTitle}
          </h1>
        )}
      </div>

      {/* 4. Bottom Cinematic Control Dock — Action buttons docked along the bottom */}
      <div className="relative z-20 flex flex-col items-center justify-center pb-2 sm:pb-6 animate-rise-in">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xl">
          <ProtocolButton
            variant={isVictory ? 'order' : 'entropy'}
            size="lg"
            onClick={() => EventBus.emit(GAME_EVENTS.RESTART_LEVEL)}
            icon={
              isVictory ? (
                <Play className="w-4 h-4 fill-current" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )
            }
            className={`w-full sm:w-auto min-w-[170px] ${
              isVictory
                ? 'shadow-[0_0_25px_rgba(0,240,255,0.4)]'
                : 'shadow-[0_0_25px_rgba(255,30,50,0.4)]'
            }`}
          >
            {primaryLabel}
          </ProtocolButton>

          <ProtocolButton
            variant="neutral"
            size="lg"
            onClick={() => EventBus.emit(GAME_EVENTS.RESTART_STORY)}
            icon={<BookOpen className="w-4 h-4" />}
            className="w-full sm:w-auto min-w-[170px] bg-black/60 backdrop-blur-md border-steel/40 hover:border-steel hover:bg-black/80"
          >
            Replay Story
          </ProtocolButton>

          <ProtocolButton
            variant="neutral"
            size="lg"
            onClick={() => EventBus.emit(GAME_EVENTS.QUIT_TO_MENU)}
            icon={<Home className="w-4 h-4" />}
            className="w-full sm:w-auto min-w-[170px] bg-black/60 backdrop-blur-md border-steel/40 hover:border-steel hover:bg-black/80"
          >
            Main Menu
          </ProtocolButton>
        </div>
      </div>
    </div>
  );
};
