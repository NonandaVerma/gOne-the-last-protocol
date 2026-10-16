'use client';

import React from 'react';
import { Play, RotateCcw, BookOpen, Settings, Home } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';

interface PauseMenuProps {
  onResume: () => void;
  onOpenSettings: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onOpenSettings }) => {
  const handleRestartLevel = () => {
    EventBus.emit(GAME_EVENTS.RESTART_LEVEL);
  };

  const handleRestartStory = () => {
    EventBus.emit(GAME_EVENTS.RESTART_STORY);
  };

  const handleQuitToMenu = () => {
    EventBus.emit(GAME_EVENTS.QUIT_TO_MENU);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-40 font-rajdhani">
      <div className="bg-slate-950/95 border border-cyan-500/50 rounded-xl p-8 max-w-sm w-full shadow-[0_0_35px_rgba(0,240,255,0.3)] flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-400 mb-2 shadow-[0_0_12px_#00f0ff]">
            <Play className="w-5 h-5 ml-0.5" />
          </div>
          <h2 className="font-orbitron font-bold text-2xl text-slate-100 tracking-wider">
            TACTICAL PAUSE
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            SIMULATION SUSPENDED
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-orbitron font-bold text-sm tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            <Play className="w-4 h-4 fill-current" />
            RESUME COMBAT
          </button>

          <button
            onClick={handleRestartLevel}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-orbitron text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART ARENA
          </button>

          <button
            onClick={handleRestartStory}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-orbitron text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            RESTART STORY
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-orbitron text-sm tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all"
          >
            <Settings className="w-4 h-4" />
            SETTINGS
          </button>

          <button
            onClick={handleQuitToMenu}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-orbitron text-sm tracking-wider bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-red-400 transition-all mt-2"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
