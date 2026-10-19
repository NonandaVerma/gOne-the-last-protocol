'use client';

import React from 'react';
import { Play, BookOpen, Home, Award } from 'lucide-react';
import { VICTORY_STORY } from '../../game/data/story';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';

export const VictoryScreen: React.FC = () => {
  const handlePlayAgain = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    EventBus.emit(GAME_EVENTS.RESTART_LEVEL);
  };

  const handleReplayStory = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    EventBus.emit(GAME_EVENTS.RESTART_STORY);
  };

  const handleQuitToMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    EventBus.emit(GAME_EVENTS.QUIT_TO_MENU);
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-40 select-none animate-fade-in overflow-hidden">
      {/* High-Resolution Victory Background Art */}
      <img
        src="/images/bg_victory.png"
        alt="Celestial Forest Sanctuary"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-35 mix-blend-screen pointer-events-none filter blur-[0.5px]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-sky-950/20 to-black/90 pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center gap-6 bg-slate-950/95 border border-sky-400/60 p-8 rounded-2xl shadow-[0_0_60px_rgba(56,189,248,0.4)]">
        {/* Victory Emblem */}
        <div className="w-16 h-16 rounded-full bg-sky-950/90 border border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_25px_#f59e0b] animate-pulse">
          <Award className="w-9 h-9" />
        </div>

        {/* Header and Subtitles */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-cinzel font-bold tracking-[0.3em] text-amber-300 uppercase">
            {VICTORY_STORY.header}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {VICTORY_STORY.subtext}
          </span>
        </div>

        {/* Main Ending Title */}
        <h1 className="font-cinzelDeco font-black text-5xl md:text-6xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-amber-200 to-cyan-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.7)]">
          {VICTORY_STORY.mainTitle}
        </h1>

        {/* Lore text */}
        <p className="text-slate-100 font-cormorant text-lg md:text-xl font-light italic max-w-md leading-relaxed border-y border-sky-900/50 py-3.5">
          &ldquo;{VICTORY_STORY.lore}&rdquo;
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center mt-2">
          <button
            onClick={handlePlayAgain}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-cinzel font-bold text-sm tracking-wider bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-400 hover:from-sky-400 hover:to-amber-300 text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all transform hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            PLAY AGAIN
          </button>

          <button
            onClick={handleReplayStory}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-cinzel text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            REPLAY STORY
          </button>

          <button
            onClick={handleQuitToMenu}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-cinzel text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
