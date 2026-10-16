'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Zap, Shield, Wind, Flame } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';

export const TouchControls: React.FC = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(isTouch);
    }
  }, []);

  if (!isTouchDevice) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex justify-between items-end p-4 z-30 select-none pb-6">
      {/* Left Hand: D-Pad Left/Right/Jump */}
      <div className="flex items-end gap-2 pointer-events-auto">
        <button
          onPointerDown={() => EventBus.emit(GAME_EVENTS.TRIGGER_MOVE_LEFT)}
          onPointerUp={() => EventBus.emit(GAME_EVENTS.TRIGGER_STOP_MOVE)}
          onPointerLeave={() => EventBus.emit(GAME_EVENTS.TRIGGER_STOP_MOVE)}
          className="w-14 h-14 rounded-full bg-slate-900/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 active:bg-cyan-500 active:text-black transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onPointerDown={() => EventBus.emit(GAME_EVENTS.TRIGGER_MOVE_RIGHT)}
          onPointerUp={() => EventBus.emit(GAME_EVENTS.TRIGGER_STOP_MOVE)}
          onPointerLeave={() => EventBus.emit(GAME_EVENTS.TRIGGER_STOP_MOVE)}
          className="w-14 h-14 rounded-full bg-slate-900/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 active:bg-cyan-500 active:text-black transition-colors backdrop-blur-sm"
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        <button
          onPointerDown={() => EventBus.emit(GAME_EVENTS.TRIGGER_JUMP)}
          className="w-14 h-14 rounded-full bg-slate-900/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 active:bg-cyan-500 active:text-black transition-colors backdrop-blur-sm ml-2"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </div>

      {/* Right Hand: Action Abilities (Shoot, Shield, Dash, Overdrive) */}
      <div className="flex flex-col gap-2 items-end pointer-events-auto">
        <div className="flex gap-2">
          <button
            onPointerDown={() => EventBus.emit(GAME_EVENTS.TRIGGER_OVERDRIVE)}
            className="w-12 h-12 rounded-full bg-slate-900/80 border border-yellow-500/50 flex items-center justify-center text-yellow-400 active:bg-yellow-500 active:text-black transition-colors backdrop-blur-sm"
            title="Overdrive"
          >
            <Flame className="w-5 h-5" />
          </button>

          <button
            onPointerDown={() => EventBus.emit(GAME_EVENTS.TRIGGER_DASH)}
            className="w-12 h-12 rounded-full bg-slate-900/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 active:bg-cyan-500 active:text-black transition-colors backdrop-blur-sm"
            title="Dash"
          >
            <Wind className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onPointerDown={() => EventBus.emit(GAME_EVENTS.TRIGGER_SHIELD)}
            className="w-14 h-14 rounded-full bg-slate-900/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 active:bg-cyan-500 active:text-black transition-colors backdrop-blur-sm"
            title="Shield"
          >
            <Shield className="w-6 h-6" />
          </button>

          <button
            onPointerDown={() => EventBus.emit(GAME_EVENTS.TRIGGER_SHOOT)}
            className="w-16 h-16 rounded-full bg-cyan-500 border border-white/60 flex items-center justify-center text-slate-950 active:bg-cyan-300 transition-colors shadow-[0_0_15px_#00f0ff]"
            title="Pulse Shot"
          >
            <Zap className="w-7 h-7 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
