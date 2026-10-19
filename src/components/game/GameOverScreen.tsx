'use client';

import React from 'react';
import { RotateCcw, BookOpen, Home, Skull, Flame } from 'lucide-react';
import { DEFEAT_STORY } from '../../game/data/story';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';

export const GameOverScreen: React.FC = () => {
  const handleRetry = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    EventBus.emit(GAME_EVENTS.RESTART_LEVEL);
  };

  const handleRestartStory = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    EventBus.emit(GAME_EVENTS.RESTART_STORY);
  };

  const handleQuitToMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    EventBus.emit(GAME_EVENTS.QUIT_TO_MENU);
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-40 select-none animate-fade-in overflow-hidden">
      {/* High-Resolution Defeat Background Art */}
      <img
        src="/images/bg_defeat.png"
        alt="Vortex Over Floating Ruins"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-screen pointer-events-none filter blur-[0.5px]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-red-950/20 to-black/90 pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center gap-6 bg-slate-950/95 border border-red-600/60 p-8 rounded-2xl shadow-[0_0_60px_rgba(239,68,68,0.35)]">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-red-950/90 border border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_25px_#dc2626] animate-pulse">
          <Skull className="w-9 h-9" />
        </div>

        {/* Header and Subtitles */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-cinzel font-bold tracking-[0.3em] text-red-400 uppercase">
            {DEFEAT_STORY.header}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {DEFEAT_STORY.subtext}
          </span>
        </div>

        {/* Main Ending Title */}
        <h1 className="font-cinzelDeco font-black text-5xl md:text-6xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-300 to-amber-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.7)]">
          {DEFEAT_STORY.mainTitle}
        </h1>

        {/* Lore text */}
        <p className="text-slate-200 font-cormorant text-lg md:text-xl font-light italic max-w-md leading-relaxed border-y border-red-900/50 py-3.5">
          &ldquo;{DEFEAT_STORY.lore}&rdquo;
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center mt-2">
          <button
            onClick={handleRetry}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-cinzel font-bold text-sm tracking-wider bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all transform hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            RETRY BATTLE
          </button>

          <button
            onClick={handleRestartStory}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-cinzel text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-red-400 text-slate-300 hover:text-red-300 transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            RESTART STORY
          </button>

          <button
            onClick={handleQuitToMenu}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-cinzel text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-red-400 text-slate-300 hover:text-red-300 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
