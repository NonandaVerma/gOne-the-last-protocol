'use client';

import React, { useEffect, useState } from 'react';
import { FastForward } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { StorySlide } from '../../game/types/game';

export const StoryOverlay: React.FC = () => {
  const [slide, setSlide] = useState<StorySlide | null>(null);
  const [stepInfo, setStepInfo] = useState({ index: 0, total: 3 });

  useEffect(() => {
    const handleStoryStep = (data: { index: number; total: number; slide: StorySlide }) => {
      setStepInfo({ index: data.index, total: data.total });
      setSlide(data.slide);
    };

    EventBus.on(GAME_EVENTS.STORY_STEP, handleStoryStep);

    return () => {
      EventBus.off(GAME_EVENTS.STORY_STEP, handleStoryStep);
    };
  }, []);

  const handleSkip = () => {
    EventBus.emit(GAME_EVENTS.SKIP_INTRO);
  };

  if (!slide) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-30 font-rajdhani select-none">
      {/* Top Header: Step Indicator & Skip Button */}
      <div className="w-full flex justify-between items-center">
        <div className="bg-black/60 backdrop-blur-md border border-slate-800 px-3 py-1 rounded text-xs font-mono text-cyan-400">
          CHRONICLE SEQUENCE // {stepInfo.index + 1} OF {stepInfo.total}
        </div>

        <button
          onClick={handleSkip}
          className="pointer-events-auto flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 px-4 py-1.5 rounded-lg text-slate-300 hover:text-cyan-300 transition-all text-xs font-orbitron tracking-wider"
        >
          <FastForward className="w-3.5 h-3.5" />
          SKIP CINEMATIC
        </button>
      </div>

      {/* Cinematic Dialogue Lower-Third Box */}
      <div className="w-full max-w-3xl mx-auto mb-8 bg-black/80 backdrop-blur-md border-l-4 border-cyan-400 p-5 rounded-r-xl shadow-2xl shadow-cyan-950/50">
        <div className="flex items-center gap-2 text-xs font-orbitron tracking-widest text-cyan-400 mb-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          {slide.speaker || 'TRANSMISSION'} :: {slide.title}
        </div>

        {slide.subtitle && (
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-2">
            {slide.subtitle}
          </div>
        )}

        <div className="flex flex-col gap-1 text-slate-100 text-base md:text-lg font-light leading-relaxed tracking-wide">
          {slide.text.map((line, idx) => (
            <p key={idx} className={slide.speaker === 'RA-ONE' ? 'text-red-300' : 'text-cyan-100'}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
