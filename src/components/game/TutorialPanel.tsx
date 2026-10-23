'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Info, Sparkles, Terminal } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';

export interface TutorialPayload {
  title: string;
  prompt: string;
  binding?: string;
  duration?: number;
}

/**
 * Dedicated compact tutorial panel positioned safely in the upper safe area
 * (upper-left directly underneath G-One's health gauge).
 *
 * Characteristics:
 * - Never overlaps subtitles (lower-center) or the ability bar (bottom-center).
 * - Styled with a dark translucent panel & thin cyan accent border.
 * - Shows only the instructions relevant to the current stage or newly introduced mechanic.
 * - Smoothly fades in when introduced and auto-fades after a generous reading window.
 * - Also handles contextual environmental interaction prompts (e.g. "[E] Activate Power Relay").
 */
export const TutorialPanel: React.FC = () => {
  const [tutorial, setTutorial] = useState<TutorialPayload | null>(null);
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleTutorial = (data: TutorialPayload) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTutorial(data);
      setVisible(true);

      const duration = data.duration ?? 4500;
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, duration);
    };

    const handleHideTutorial = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(false);
    };

    const handlePrompt = (data: { text: string; active: boolean } | null) => {
      if (data && data.active) {
        setInteractionPrompt(data.text);
      } else {
        setInteractionPrompt(null);
      }
    };

    const handleReset = () => {
      handleHideTutorial();
      setInteractionPrompt(null);
    };

    EventBus.on(GAME_EVENTS.SHOW_TUTORIAL, handleTutorial);
    EventBus.on(GAME_EVENTS.HIDE_TUTORIAL, handleHideTutorial);
    EventBus.on(GAME_EVENTS.INTERACTION_PROMPT, handlePrompt);
    EventBus.on(GAME_EVENTS.GAME_STATE_CHANGED, handleReset);
    EventBus.on(GAME_EVENTS.RESTART_LEVEL, handleReset);

    return () => {
      EventBus.off(GAME_EVENTS.SHOW_TUTORIAL, handleTutorial);
      EventBus.off(GAME_EVENTS.HIDE_TUTORIAL, handleHideTutorial);
      EventBus.off(GAME_EVENTS.INTERACTION_PROMPT, handlePrompt);
      EventBus.off(GAME_EVENTS.GAME_STATE_CHANGED, handleReset);
      EventBus.off(GAME_EVENTS.RESTART_LEVEL, handleReset);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="absolute top-[74px] left-3 md:left-5 z-25 flex flex-col gap-1.5 max-w-[260px] pointer-events-none select-none">
      {/* Contextual interaction prompt when near an interactive object */}
      {interactionPrompt && (
        <div className="clip-notch border border-order-cyan bg-graphite/95 px-3 py-2 flex items-center gap-2 shadow-[0_0_15px_rgba(0,207,255,0.4)] animate-bounce-subtle">
          <Terminal className="w-3.5 h-3.5 text-order-cyan shrink-0 animate-pulse" />
          <span className="font-ui font-semibold text-[0.72rem] tracking-wide text-order-ice uppercase">
            {interactionPrompt}
          </span>
        </div>
      )}

      {/* Stage-specific contextual tutorial panel */}
      {tutorial && (
        <div
          className={`panel border border-order-cyan/40 bg-graphite/90 p-3 flex flex-col gap-1 transition-all duration-500 transform ${
            visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none'
          }`}
          style={{
            boxShadow: '0 4px 16px rgba(0,0,0,0.7), 0 0 10px rgba(0,207,255,0.15)',
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-steel/20 pb-1">
            <span className="hud-label text-[0.62rem] text-order-cyan flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <Info className="w-3 h-3 text-order-cyan" />
              {tutorial.title}
            </span>
            {tutorial.binding && (
              <span className="font-mono text-[0.6rem] font-bold text-order-ice bg-obsidian px-1.5 py-0.5 border border-order-cyan/30">
                {tutorial.binding}
              </span>
            )}
          </div>
          <p className="font-ui text-[0.68rem] text-paper/90 leading-tight pt-0.5">
            {tutorial.prompt}
          </p>
        </div>
      )}
    </div>
  );
};
