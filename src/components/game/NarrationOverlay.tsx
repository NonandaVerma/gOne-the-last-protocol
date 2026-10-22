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
 * Dedicated, centralized narration & subtitle presentation system.
 *
 * Enforces:
 * - Pure white text (#FFFFFF) matching cinematic trailer presentation.
 * - Strong dual text-shadow + subtle dark backing for 100% legibility over any background.
 * - Single-active subtitle rule (no overlapping text or stacked lines).
 * - Priority queue & duplicate event suppression.
 * - Clean fade-in and fade-out transitions.
 * - Reserved lower-center safe area positioned cleanly above the ability bar.
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

    const duration = next.duration ?? Math.max(3000, next.text.length * 65);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      fadeTimerRef.current = setTimeout(() => {
        setCurrent(null);
        displayNext();
      }, 350);
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
      fadeTimerRef.current = setTimeout(() => setCurrent(null), 300);
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

  return (
    <div
      className="absolute inset-x-0 bottom-[96px] md:bottom-[88px] flex justify-center px-4 md:px-8 pointer-events-none z-30 select-none"
      aria-live="polite"
    >
      <div
        className={`max-w-2xl px-5 py-2.5 rounded-sm bg-obsidian/85 border border-white/10 backdrop-blur-sm transition-all duration-300 transform flex flex-col items-center gap-1 ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-98'
        }`}
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.85), inset 0 0 12px rgba(0,0,0,0.5)',
        }}
      >
        {current?.speaker && (
          <span className="font-ui text-[0.65rem] tracking-[0.2em] font-bold uppercase text-order-ice/90 drop-shadow">
            [ {current.speaker} ]
          </span>
        )}
        <p
          className="font-ui font-medium text-sm md:text-base lg:text-lg text-center tracking-wide text-white leading-snug drop-shadow-md"
          style={{
            textShadow: '0 2px 10px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,1)',
          }}
        >
          {current?.text}
        </p>
      </div>
    </div>
  );
};
