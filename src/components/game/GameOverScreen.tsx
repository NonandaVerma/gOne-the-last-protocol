'use client';

import React from 'react';
import { RotateCcw, BookOpen, Home, Skull } from 'lucide-react';
import { DEFEAT_STORY } from '../../game/data/story';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';

export const GameOverScreen: React.FC = () => {
  const handleRetry = () => {
    EventBus.emit(GAME_EVENTS.RESTART_LEVEL);
  };

  const handleRestartStory = () => {
    EventBus.emit(GAME_EVENTS.RESTART_STORY);
  };

  const handleQuitToMenu = () => {
    EventBus.emit(GAME_EVENTS.QUIT_TO_MENU);
  };

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 z-40 font-rajdhani select-none animate-fade-in">
      <div className="max-w-xl w-full flex flex-col items-center text-center gap-6 bg-slate-950/90 border border-red-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(255,0,51,0.3)]">
        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_20px_#ff0033] animate-pulse">
          <Skull className="w-8 h-8" />
        </div>

        {/* Header and Subtitles */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono tracking-[0.3em] text-red-400 uppercase">
            {DEFEAT_STORY.header}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {DEFEAT_STORY.subtext}
          </span>
        </div>

        {/* Main Ending Title */}
        <h1 className="font-orbitron font-black text-5xl md:text-6xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-300 to-red-600 drop-shadow-[0_0_25px_rgba(255,0,51,0.6)]">
          {DEFEAT_STORY.mainTitle}
        </h1>

        {/* Lore text */}
        <p className="text-slate-300 text-sm md:text-base font-light italic max-w-md leading-relaxed border-y border-red-900/40 py-3">
          &ldquo;{DEFEAT_STORY.lore}&rdquo;
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center mt-2">
          <button
            onClick={handleRetry}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-orbitron font-bold text-sm tracking-wider bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-[0_0_20px_rgba(255,0,51,0.4)] transition-all transform hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            RETRY BATTLE
          </button>

          <button
            onClick={handleRestartStory}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-orbitron text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-red-400 text-slate-300 hover:text-red-300 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            RESTART STORY
          </button>

          <button
            onClick={handleQuitToMenu}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-orbitron text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-red-400 text-slate-300 hover:text-red-300 transition-all"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
