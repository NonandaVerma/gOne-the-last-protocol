'use client';

import React from 'react';
import { Play, BookOpen, Home, Award } from 'lucide-react';
import { VICTORY_STORY } from '../../game/data/story';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';

export const VictoryScreen: React.FC = () => {
  const handlePlayAgain = () => {
    EventBus.emit(GAME_EVENTS.RESTART_LEVEL);
  };

  const handleReplayStory = () => {
    EventBus.emit(GAME_EVENTS.RESTART_STORY);
  };

  const handleQuitToMenu = () => {
    EventBus.emit(GAME_EVENTS.QUIT_TO_MENU);
  };

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 z-40 font-rajdhani select-none animate-fade-in">
      <div className="max-w-xl w-full flex flex-col items-center text-center gap-6 bg-slate-950/90 border border-cyan-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.35)]">
        {/* Victory Emblem */}
        <div className="w-14 h-14 rounded-full bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_#00f0ff] animate-pulse">
          <Award className="w-8 h-8" />
        </div>

        {/* Header and Subtitles */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase">
            {VICTORY_STORY.header}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {VICTORY_STORY.subtext}
          </span>
        </div>

        {/* Main Ending Title */}
        <h1 className="font-orbitron font-black text-5xl md:text-6xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-500 drop-shadow-[0_0_30px_rgba(0,240,255,0.7)]">
          {VICTORY_STORY.mainTitle}
        </h1>

        {/* Lore text */}
        <p className="text-slate-200 text-sm md:text-base font-light italic max-w-md leading-relaxed border-y border-cyan-900/40 py-3">
          &ldquo;{VICTORY_STORY.lore}&rdquo;
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center mt-2">
          <button
            onClick={handlePlayAgain}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-orbitron font-bold text-sm tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all transform hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            PLAY AGAIN
          </button>

          <button
            onClick={handleReplayStory}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-orbitron text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            REPLAY STORY
          </button>

          <button
            onClick={handleQuitToMenu}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-orbitron text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
