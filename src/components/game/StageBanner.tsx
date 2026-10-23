'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { SeamSigil } from '../ui/Seam';

/** How long a stage announcement stays on screen before fading out. */
const VISIBLE_MS = 2800;

/**
 * Brief, readable confirmation that a realm's internal stage has advanced.
 *
 * Backgrounds crossfade silently (`Backdrop.ts`) and two consecutive stage
 * images can look visually similar mid-combat, so without this the player has
 * no reliable way to notice progression — this is the fix for that gap.
 */
export const StageBanner: React.FC = () => {
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onAnnounce = (text: string) => {
      clearTimeout(hideTimerRef.current);
      setLabel(text);
      setVisible(true);
      hideTimerRef.current = setTimeout(() => setVisible(false), VISIBLE_MS);
    };

    EventBus.on(GAME_EVENTS.STAGE_ANNOUNCED, onAnnounce);
    return () => {
      EventBus.off(GAME_EVENTS.STAGE_ANNOUNCED, onAnnounce);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!label) return null;

  return (
    <div
      className="absolute inset-x-0 top-[64px] flex justify-center pointer-events-none z-25 select-none"
      aria-live="polite"
    >
      <div
        className={`panel px-6 py-2.5 flex items-center gap-2.5 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <SeamSigil size={13} />
        <span className="font-display font-bold text-xs md:text-sm tracking-[0.2em] uppercase text-paper">
          {label}
        </span>
        <SeamSigil size={13} />
      </div>
    </div>
  );
};
