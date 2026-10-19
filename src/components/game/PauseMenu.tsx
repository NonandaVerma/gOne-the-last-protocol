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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-40 font-garamond">
      <div className="bg-slate-950/95 border-2 border-amber-500/40 rounded-xl p-8 max-w-sm w-full shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-950/60 border border-amber-400 flex items-center justify-center text-amber-300 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            <Play className="w-6 h-6 ml-0.5 fill-current" />
          </div>
          <h2 className="font-cinzel font-bold text-2xl text-amber-200 tracking-widest drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
            CELESTIAL REPOSE
          </h2>
          <p className="text-xs text-cyan-300 font-cinzel tracking-wider mt-1 uppercase">
            Combat Suspended // Protocol In Stasis
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-cinzel font-bold text-sm tracking-widest bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)]"
          >
            <Play className="w-4 h-4 fill-current" />
            RESUME PROTOCOL
          </button>

          <button
            onClick={(e) => {
              e.currentTarget.blur();
              handleRestartLevel();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-cinzel text-sm tracking-wider bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART ARENA
          </button>

          <button
            onClick={(e) => {
              e.currentTarget.blur();
              handleRestartStory();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-cinzel text-sm tracking-wider bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            RESTART STORY
          </button>

          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-cinzel text-sm tracking-wider bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 transition-all"
          >
            <Settings className="w-4 h-4" />
            SETTINGS & RELICS
          </button>

          <button
            onClick={(e) => {
              e.currentTarget.blur();
              handleQuitToMenu();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-cinzel text-sm tracking-wider bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-red-400 transition-all mt-2"
          >
            <Home className="w-4 h-4" />
            RETURN TO SANCTUM
          </button>
        </div>
      </div>
    </div>
  );
};
