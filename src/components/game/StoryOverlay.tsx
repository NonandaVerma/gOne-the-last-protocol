'use client';

import React, { useEffect, useState } from 'react';
import { FastForward, Shield, Flame, Film, X } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { StorySlide } from '../../game/types/game';

export const StoryOverlay: React.FC = () => {
  const [slide, setSlide] = useState<StorySlide | null>(null);
  const [stepInfo, setStepInfo] = useState({ index: 0, total: 3 });
  const [showVideo, setShowVideo] = useState(false);

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

  const handleSkip = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    EventBus.emit(GAME_EVENTS.SKIP_INTRO);
  };

  if (!slide) return null;

  const isRaOne = slide.speaker === 'RA-ONE';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-10 z-30 select-none overflow-hidden">
      {/* High-Resolution Prologue Background Art */}
      <img
        src="/images/bg_arrival.png"
        alt="Collision of Realms: G-One's Arrival"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-35 mix-blend-luminosity scale-105 pointer-events-none filter blur-[0.5px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 pointer-events-none" />

      {/* Top Header: Step Indicator & Actions */}
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center z-10">
        <div className="bg-black/80 backdrop-blur-md border border-slate-800/80 px-4 py-1.5 rounded-md text-xs font-cinzel tracking-widest text-divine-celestial flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>MYTHIC CHRONICLE // STAGE {stepInfo.index + 1} OF {stepInfo.total}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              setShowVideo(!showVideo);
            }}
            className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 px-3.5 py-2 rounded-md text-amber-200 hover:text-amber-100 transition-all text-xs font-cinzel tracking-wider shadow-lg active:scale-95"
          >
            <Film className="w-3.5 h-3.5 text-amber-400" />
            {showVideo ? 'CLOSE TEASER' : 'WATCH TEASER VIDEO'}
          </button>

          <button
            onClick={handleSkip}
            className="flex items-center gap-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-400/80 px-4 py-2 rounded-md text-slate-300 hover:text-amber-300 transition-all text-xs font-cinzel tracking-wider shadow-lg active:scale-95"
          >
            <FastForward className="w-3.5 h-3.5" />
            SKIP TO ARENA [SPACE]
          </button>
        </div>
      </div>

      {/* TEASER VIDEO EMBED (WHEN TOGGLED) */}
      {showVideo && (
        <div className="pointer-events-auto my-auto w-full max-w-4xl mx-auto bg-slate-950 border-2 border-amber-400/70 rounded-2xl p-4 shadow-[0_0_50px_rgba(245,158,11,0.5)] z-40 flex flex-col gap-3 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-cinzel font-bold text-amber-300 tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" /> PROLOGUE TEASER // CINEMATIC ARCHIVE
            </span>
            <button
              onClick={() => setShowVideo(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800">
            <video
              src="/images/video_intro.mp4"
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Cinematic Dialogue Lower-Third Box */}
      <div
        className={`w-full max-w-4xl mx-auto mb-6 bg-slate-950/90 backdrop-blur-md p-6 rounded-xl shadow-2xl border-l-4 transition-all ${
          isRaOne
            ? 'border-red-600 shadow-red-950/50 bg-gradient-to-r from-red-950/40 via-slate-950/90 to-black'
            : 'border-divine-celestial shadow-cyan-950/50 bg-gradient-to-r from-sky-950/40 via-slate-950/90 to-black'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-cinzel font-bold tracking-[0.25em] uppercase">
            {isRaOne ? (
              <>
                <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-red-400">RA-ONE :: THE VIKING DESTROYER</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-divine-celestial animate-pulse" />
                <span className="text-sky-300">G-ONE :: THE DIVINE GUARDIAN</span>
              </>
            )}
          </div>
          <span className="text-[11px] font-mono tracking-wider text-slate-400">
            {slide.title}
          </span>
        </div>

        {slide.subtitle && (
          <div className="text-xs font-cinzel text-amber-400/80 tracking-widest uppercase mb-3">
            {slide.subtitle}
          </div>
        )}

        <div className="flex flex-col gap-2 font-cormorant text-lg md:text-2xl font-light italic leading-relaxed tracking-wide">
          {slide.text.map((line, idx) => (
            <p
              key={idx}
              className={
                isRaOne
                  ? 'text-red-200 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'text-sky-100 drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]'
              }
            >
              &ldquo;{line}&rdquo;
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
