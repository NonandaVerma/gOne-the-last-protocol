'use client';

import React from 'react';
import { BookOpen, Home, Play, RotateCcw } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { ProtocolButton } from '../ui/ProtocolButton';
import { SeamDivider, SeamSigil } from '../ui/Seam';

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
 * Shared presentation for both endings.
 *
 * Victory stabilises the seam into controlled cyan-white; defeat collapses it
 * into crimson. Both resolve to the same real navigation events, so the two
 * screens can never drift apart in behaviour.
 */
export const EndingScreen: React.FC<EndingScreenProps> = ({
  outcome,
  copy,
  image,
  primaryLabel,
}) => {
  const isVictory = outcome === 'victory';

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6 select-none overflow-hidden animate-fade-in">
      {/* Backdrop art — legible, not washed out */}
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-60 animate-slow-push"
      />
      <div
        className={`absolute inset-0 ${
          isVictory
            ? 'bg-gradient-to-b from-obsidian/85 via-order-deep/55 to-obsidian/95'
            : 'bg-gradient-to-b from-obsidian/90 via-entropy-dark/60 to-obsidian/96'
        }`}
      />

      {/* The seam: stabilised on victory, bleeding on defeat */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px pointer-events-none"
        aria-hidden="true"
        style={{
          background: isVictory
            ? 'linear-gradient(to bottom, transparent, rgba(0,207,255,0.85), transparent)'
            : 'linear-gradient(to bottom, transparent, rgba(255,36,61,0.75), transparent)',
          boxShadow: isVictory
            ? '0 0 30px 6px rgba(0,207,255,0.45)'
            : '0 0 30px 6px rgba(255,36,61,0.4)',
        }}
      />

      <div
        className={`panel ${
          isVictory ? 'panel-order' : 'panel-entropy'
        } relative z-10 max-w-xl w-full p-8 flex flex-col items-center text-center gap-5 animate-rise-in`}
      >
        <SeamSigil size={26} />

        <div className="flex flex-col gap-1.5">
          <span
            className={`hud-label ${isVictory ? 'text-order-cyan' : 'text-entropy-crimson'}`}
          >
            {copy.header}
          </span>
          <span className="font-ui text-[0.68rem] tracking-[0.18em] uppercase text-muted/70">
            {copy.subtext}
          </span>
        </div>

        <h1
          className={`font-display font-black text-4xl md:text-5xl tracking-[0.1em] ${
            isVictory ? 'metal-text-order' : 'metal-text-entropy'
          }`}
        >
          {copy.mainTitle}
        </h1>

        <SeamDivider className="max-w-xs" />

        <p className="font-body text-sm md:text-base leading-relaxed text-muted max-w-md">
          {copy.lore}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full mt-2">
          <ProtocolButton
            variant={isVictory ? 'order' : 'entropy'}
            size="md"
            onClick={() => EventBus.emit(GAME_EVENTS.RESTART_LEVEL)}
            icon={
              isVictory ? (
                <Play className="w-4 h-4 fill-current" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )
            }
            className="flex-1"
          >
            {primaryLabel}
          </ProtocolButton>

          <ProtocolButton
            variant="neutral"
            size="md"
            onClick={() => EventBus.emit(GAME_EVENTS.RESTART_STORY)}
            icon={<BookOpen className="w-4 h-4" />}
            className="flex-1"
          >
            Replay Story
          </ProtocolButton>

          <ProtocolButton
            variant="neutral"
            size="md"
            onClick={() => EventBus.emit(GAME_EVENTS.QUIT_TO_MENU)}
            icon={<Home className="w-4 h-4" />}
            className="flex-1"
          >
            Main Menu
          </ProtocolButton>
        </div>
      </div>
    </div>
  );
};
