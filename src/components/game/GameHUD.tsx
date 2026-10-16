'use client';

import React, { useEffect, useState } from 'react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { Shield, Zap, Sparkles, Wind, Pause, Flame } from 'lucide-react';

interface CooldownInfo {
  current: number;
  max: number;
  active?: boolean;
}

export const GameHUD: React.FC = () => {
  const [playerHealth, setPlayerHealth] = useState({ current: 3, max: 3 });
  const [bossHealth, setBossHealth] = useState({ current: 8, max: 8 });
  const [levelInfo, setLevelInfo] = useState({ level: 1, name: 'THE INFERNAL ARENA', subtitle: 'Chapter I' });
  const [overdrive, setOverdrive] = useState({ charge: 0, isActive: false });
  const [cooldowns, setCooldowns] = useState<{
    pulseShot: CooldownInfo;
    aegisShield: CooldownInfo;
    arcBurst: CooldownInfo;
    dash: CooldownInfo;
    overdrive: { ready: boolean; active?: boolean };
  }>({
    pulseShot: { current: 0, max: 350 },
    aegisShield: { current: 0, max: 6000 },
    arcBurst: { current: 0, max: 4500 },
    dash: { current: 0, max: 2500 },
    overdrive: { ready: false },
  });

  useEffect(() => {
    const handlePlayerHealth = (data: { current: number; max: number }) => setPlayerHealth(data);
    const handleBossHealth = (data: { current: number; max: number }) => setBossHealth(data);
    const handleLevelLoaded = (data: { level: number; name: string; subtitle: string }) => setLevelInfo(data);
    const handleOverdrive = (data: { charge: number; isActive: boolean }) => setOverdrive(data);
    const handleCooldowns = (data: any) => setCooldowns(data);

    EventBus.on(GAME_EVENTS.PLAYER_HEALTH_CHANGED, handlePlayerHealth);
    EventBus.on(GAME_EVENTS.BOSS_HEALTH_CHANGED, handleBossHealth);
    EventBus.on(GAME_EVENTS.LEVEL_LOADED, handleLevelLoaded);
    EventBus.on(GAME_EVENTS.OVERDRIVE_CHANGED, handleOverdrive);
    EventBus.on(GAME_EVENTS.COOLDOWNS_CHANGED, handleCooldowns);

    return () => {
      EventBus.off(GAME_EVENTS.PLAYER_HEALTH_CHANGED, handlePlayerHealth);
      EventBus.off(GAME_EVENTS.BOSS_HEALTH_CHANGED, handleBossHealth);
      EventBus.off(GAME_EVENTS.LEVEL_LOADED, handleLevelLoaded);
      EventBus.off(GAME_EVENTS.OVERDRIVE_CHANGED, handleOverdrive);
      EventBus.off(GAME_EVENTS.COOLDOWNS_CHANGED, handleCooldowns);
    };
  }, []);

  const handlePause = () => {
    EventBus.emit(GAME_EVENTS.PAUSE_GAME);
  };

  const getCooldownPercent = (cd: CooldownInfo) => {
    if (cd.current <= 0) return 0;
    return Math.min(100, Math.round((cd.current / cd.max) * 100));
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-20 font-rajdhani select-none">
      {/* Top Header: Health Bars & Level Title */}
      <div className="w-full flex justify-between items-start gap-4">
        {/* Left: G-ONE Core Health Units */}
        <div className="flex flex-col gap-1 bg-black/60 backdrop-blur-md border border-cyan-500/40 p-3 rounded-lg shadow-lg shadow-cyan-950/40 min-w-[240px]">
          <div className="flex items-center justify-between">
            <span className="font-orbitron font-bold text-sm tracking-widest text-cyan-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
              G-ONE
            </span>
            <span className="text-xs text-cyan-300/80 font-mono">
              HP: {playerHealth.current} / {playerHealth.max}
            </span>
          </div>

          {/* Player Core Indicators (3 units or 1 in Level 3) */}
          <div className="flex gap-2 mt-1">
            {Array.from({ length: playerHealth.max }).map((_, idx) => {
              const isFilled = idx < playerHealth.current;
              return (
                <div
                  key={idx}
                  className={`h-4 flex-1 rounded-sm border transition-all duration-300 relative overflow-hidden ${
                    isFilled
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-300 border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.7)]'
                      : 'bg-slate-900/80 border-slate-700/50 opacity-40'
                  }`}
                >
                  {isFilled && (
                    <div className="absolute inset-0 bg-white/30 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Overdrive Meter */}
          <div className="mt-1 flex flex-col gap-0.5">
            <div className="flex justify-between text-[11px] font-mono tracking-wider text-slate-400">
              <span>OVERDRIVE [E]</span>
              <span className={overdrive.charge >= 100 ? 'text-cyan-300 font-bold animate-pulse' : ''}>
                {overdrive.isActive ? 'ACTIVE' : `${overdrive.charge}%`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-200 ${
                  overdrive.isActive
                    ? 'bg-gradient-to-r from-yellow-400 to-cyan-400 animate-pulse w-full'
                    : 'bg-cyan-400'
                }`}
                style={{ width: overdrive.isActive ? '100%' : `${overdrive.charge}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Arena Title & Pause Button */}
        <div className="flex flex-col items-center">
          <div className="bg-black/60 backdrop-blur-md border border-slate-800 px-4 py-1.5 rounded-b-lg flex flex-col items-center">
            <span className="font-orbitron text-xs tracking-widest text-slate-400 uppercase">
              {levelInfo.subtitle}
            </span>
            <span className="font-orbitron font-bold text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-slate-100 to-red-400">
              {levelInfo.name}
            </span>
          </div>

          <button
            onClick={handlePause}
            className="pointer-events-auto mt-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 p-2 rounded-full text-slate-300 hover:text-cyan-300 transition-all shadow-md active:scale-95"
            title="Pause Game [ESC]"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        {/* Right: RA-ONE Boss Health Units */}
        <div className="flex flex-col gap-1 bg-black/60 backdrop-blur-md border border-red-500/40 p-3 rounded-lg shadow-lg shadow-red-950/40 min-w-[240px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-300/80 font-mono">
              HP: {bossHealth.current} / {bossHealth.max}
            </span>
            <span className="font-orbitron font-bold text-sm tracking-widest text-red-500 flex items-center gap-2">
              RA-ONE
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ff0033]" />
            </span>
          </div>

          {/* Boss Segmented Units (8 units or 1 in Level 3) */}
          <div className="flex gap-1.5 mt-1">
            {Array.from({ length: bossHealth.max }).map((_, idx) => {
              const isFilled = idx < bossHealth.current;
              return (
                <div
                  key={idx}
                  className={`h-4 flex-1 rounded-sm border transition-all duration-300 relative overflow-hidden ${
                    isFilled
                      ? 'bg-gradient-to-r from-red-600 to-rose-400 border-red-400 shadow-[0_0_8px_rgba(255,0,51,0.6)]'
                      : 'bg-slate-900/80 border-slate-800 opacity-30'
                  }`}
                >
                  {isFilled && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-right text-[11px] font-mono tracking-widest text-red-400/80 mt-1">
            {bossHealth.current === 1 ? 'CRITICAL CORE INSTABILITY' : 'HOSTILE PROTOCOL DETECTED'}
          </div>
        </div>
      </div>

      {/* Bottom Footer: Ability Cooldown Badges & Key Reference */}
      <div className="w-full flex justify-center items-end gap-3 pb-2">
        {/* Pulse Shot */}
        <div className="relative bg-slate-900/80 border border-slate-700/80 rounded-lg p-2 flex items-center gap-2 min-w-[100px] overflow-hidden">
          <Zap className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-200">PULSE</span>
            <span className="text-[10px] text-cyan-400 font-mono">[L-CLICK / J]</span>
          </div>
          {getCooldownPercent(cooldowns.pulseShot) > 0 && (
            <div
              className="absolute inset-0 bg-slate-950/80 border-t border-cyan-400 pointer-events-none transition-all duration-100"
              style={{ height: `${getCooldownPercent(cooldowns.pulseShot)}%` }}
            />
          )}
        </div>

        {/* Aegis Shield */}
        <div
          className={`relative bg-slate-900/80 border rounded-lg p-2 flex items-center gap-2 min-w-[100px] overflow-hidden transition-colors ${
            cooldowns.aegisShield.active
              ? 'border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.6)] bg-cyan-950/40'
              : 'border-slate-700/80'
          }`}
        >
          <Shield className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-200">SHIELD</span>
            <span className="text-[10px] text-cyan-400 font-mono">[R-CLICK / K]</span>
          </div>
          {getCooldownPercent(cooldowns.aegisShield) > 0 && !cooldowns.aegisShield.active && (
            <div
              className="absolute inset-0 bg-slate-950/80 border-t border-cyan-400 pointer-events-none transition-all duration-100"
              style={{ height: `${getCooldownPercent(cooldowns.aegisShield)}%` }}
            />
          )}
        </div>

        {/* Arc Burst */}
        <div className="relative bg-slate-900/80 border border-slate-700/80 rounded-lg p-2 flex items-center gap-2 min-w-[100px] overflow-hidden">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-200">ARC BURST</span>
            <span className="text-[10px] text-cyan-400 font-mono">[KEY L]</span>
          </div>
          {getCooldownPercent(cooldowns.arcBurst) > 0 && (
            <div
              className="absolute inset-0 bg-slate-950/80 border-t border-cyan-400 pointer-events-none transition-all duration-100"
              style={{ height: `${getCooldownPercent(cooldowns.arcBurst)}%` }}
            />
          )}
        </div>

        {/* Tactical Dash */}
        <div className="relative bg-slate-900/80 border border-slate-700/80 rounded-lg p-2 flex items-center gap-2 min-w-[100px] overflow-hidden">
          <Wind className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-200">DASH</span>
            <span className="text-[10px] text-cyan-400 font-mono">[SHIFT]</span>
          </div>
          {getCooldownPercent(cooldowns.dash) > 0 && (
            <div
              className="absolute inset-0 bg-slate-950/80 border-t border-cyan-400 pointer-events-none transition-all duration-100"
              style={{ height: `${getCooldownPercent(cooldowns.dash)}%` }}
            />
          )}
        </div>

        {/* Overdrive Trigger */}
        <div
          className={`relative rounded-lg p-2 flex items-center gap-2 min-w-[110px] border transition-all ${
            overdrive.charge >= 100 || overdrive.isActive
              ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_#00f0ff] animate-pulse text-cyan-200'
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
        >
          <Flame className={`w-4 h-4 ${overdrive.charge >= 100 ? 'text-yellow-400' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className="text-xs font-bold">OVERDRIVE</span>
            <span className="text-[10px] font-mono">[KEY E]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
