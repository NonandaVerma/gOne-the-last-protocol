'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';

export interface SubtitlePayload {
  text: string;
  speaker?: string;
  duration?: number;
  priority?: number; // Higher number = higher priority
  id?: string;
}

/**
 * Dedicated, centralized narration & subtitle presentation system — the only
 * one. (A second, Phaser-canvas-rendered path used to exist as `Juice.taunt()`
 * for boss/objective lines, with its own hardcoded font string and its own
 * bottom-anchored position; it rendered inconsistently with this component's
 * next/font-loaded Rajdhani and physically stacked on top of it and the
 * ability bar. All of it now routes through here instead.)
 *
 * Enforces:
 * - White body text with a speaker tag coloured by faction (RA-ONE crimson,
 *   G-ONE cyan, anything else neutral steel) — same two-colour language as
 *   the rest of the UI, no third accent.
 * - Strong dual text-shadow + subtle dark backing for legibility over any background.
 * - Single-active subtitle rule (no overlapping text or stacked lines).
 * - Priority queue & duplicate event suppression.
 * - Clean fade-in and fade-out transitions.
 * - Positioned in the upper third, clear of the ability bar and the rest of
 *   the lower screen where gameplay actually happens.
 */
export const NarrationOverlay: React.FC = () => {
  const [current, setCurrent] = useState<SubtitlePayload | null>(null);
  const [visible, setVisible] = useState(false);

  const queueRef = useRef<SubtitlePayload[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIdRef = useRef<string>('');

  const displayNext = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    if (queueRef.current.length === 0) {
      setVisible(false);
      fadeTimerRef.current = setTimeout(() => {
        setCurrent(null);
      }, 350);
      return;
    }

    const next = queueRef.current.shift()!;
    setCurrent(next);
    setVisible(true);

    const duration = next.duration ?? Math.min(4200, Math.max(2600, next.text.length * 48));

    timerRef.current = setTimeout(() => {
      setVisible(false);
      fadeTimerRef.current = setTimeout(() => {
        setCurrent(null);
        displayNext();
      }, 250);
    }, duration);
  }, []);

  useEffect(() => {
    const handleShow = (payload: SubtitlePayload | string) => {
      const data: SubtitlePayload = typeof payload === 'string' ? { text: payload } : payload;
      if (!data.text || data.text.trim() === '') return;

      // Duplicate prevention: do not re-enqueue identical text if it's currently showing
      const key = `${data.speaker || ''}:${data.text}`;
      if (lastIdRef.current === key && visible) return;
      lastIdRef.current = key;

      // Urgent high priority items (priority >= 2) replace current subtitle
      if ((data.priority ?? 0) >= 2) {
        queueRef.current = [data];
        displayNext();
        return;
      }

      // Normal items: if already showing something of equal or higher priority, queue it (max queue 3)
      if (current && visible) {
        if (queueRef.current.length < 3) {
          queueRef.current.push(data);
        }
      } else {
        queueRef.current = [data];
        displayNext();
      }
    };

    const handleHide = () => {
      queueRef.current = [];
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      setVisible(false);
      fadeTimerRef.current = setTimeout(() => setCurrent(null), 250);
    };

    const handleStateReset = () => {
      handleHide();
      lastIdRef.current = '';
    };

    EventBus.on(GAME_EVENTS.SHOW_SUBTITLE, handleShow);
    EventBus.on(GAME_EVENTS.HIDE_SUBTITLE, handleHide);
    EventBus.on(GAME_EVENTS.GAME_STATE_CHANGED, handleStateReset);
    EventBus.on(GAME_EVENTS.RESTART_LEVEL, handleStateReset);

    return () => {
      EventBus.off(GAME_EVENTS.SHOW_SUBTITLE, handleShow);
      EventBus.off(GAME_EVENTS.HIDE_SUBTITLE, handleHide);
      EventBus.off(GAME_EVENTS.GAME_STATE_CHANGED, handleStateReset);
      EventBus.off(GAME_EVENTS.RESTART_LEVEL, handleStateReset);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [current, visible, displayNext]);

  if (!current && !visible) return null;

  const speaker = current?.speaker?.toUpperCase();
  const speakerTone =
    speaker === 'RA-ONE'
      ? 'text-entropy-hi border-entropy-crimson/30'
      : speaker === 'G-ONE'
      ? 'text-order-ice border-order-cyan/30'
      : 'text-steel border-steel/20';

  return (
    <div
      className="absolute inset-x-0 top-[70px] md:top-[74px] flex justify-center px-4 pointer-events-none z-30 select-none"
      aria-live="polite"
    >
      <div
        className={`max-w-xl px-4 py-1.5 clip-notch bg-obsidian/80 border border-white/10 backdrop-blur-xs transition-all duration-300 transform flex flex-col items-center gap-0.5 ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-98'
        }`}
        style={{
          boxShadow: '0 4px 16px rgba(0,0,0,0.85), inset 0 0 8px rgba(0,0,0,0.4)',
        }}
      >
        {current?.speaker && (
          <span
            className={`font-ui text-[0.58rem] tracking-[0.18em] font-bold uppercase border-b pb-0.5 ${speakerTone}`}
          >
            [ {current.speaker} ]
          </span>
        )}
        <p
          className="font-ui font-medium text-xs md:text-sm text-center tracking-wide text-white leading-tight drop-shadow-md"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,1)',
          }}
        >
          {current?.text}
        </p>
      </div>
    </div>
  );
};
