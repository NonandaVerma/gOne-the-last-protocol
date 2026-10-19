'use client';

import React, { useEffect, useState } from 'react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { Shield, Zap, Sparkles, Wind, Pause, Flame, Heart, Award } from 'lucide-react';
import { ActiveRelicState } from '../../game/types/game';

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
  const [activeRelics, setActiveRelics] = useState<ActiveRelicState[]>([]);
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
    const handleActiveRelics = (data: ActiveRelicState[]) => setActiveRelics(data);

    EventBus.on(GAME_EVENTS.PLAYER_HEALTH_CHANGED, handlePlayerHealth);
    EventBus.on(GAME_EVENTS.BOSS_HEALTH_CHANGED, handleBossHealth);
    EventBus.on(GAME_EVENTS.LEVEL_LOADED, handleLevelLoaded);
    EventBus.on(GAME_EVENTS.OVERDRIVE_CHANGED, handleOverdrive);
    EventBus.on(GAME_EVENTS.COOLDOWNS_CHANGED, handleCooldowns);
    EventBus.on(GAME_EVENTS.ACTIVE_RELICS_CHANGED, handleActiveRelics);

    return () => {
      EventBus.off(GAME_EVENTS.PLAYER_HEALTH_CHANGED, handlePlayerHealth);
      EventBus.off(GAME_EVENTS.BOSS_HEALTH_CHANGED, handleBossHealth);
      EventBus.off(GAME_EVENTS.LEVEL_LOADED, handleLevelLoaded);
      EventBus.off(GAME_EVENTS.OVERDRIVE_CHANGED, handleOverdrive);
      EventBus.off(GAME_EVENTS.COOLDOWNS_CHANGED, handleCooldowns);
      EventBus.off(GAME_EVENTS.ACTIVE_RELICS_CHANGED, handleActiveRelics);
    };
  }, []);

  const handlePause = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    EventBus.emit(GAME_EVENTS.PAUSE_GAME);
  };

  const getCooldownPercent = (cd: CooldownInfo) => {
    if (cd.current <= 0) return 0;
    return Math.min(100, Math.round((cd.current / cd.max) * 100));
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between z-20 select-none">
      {/* Top Header: Health Bars & Level Title */}
      <div className="w-full flex justify-between items-start gap-4">
        {/* Left: G-ONE Divine Health Units */}
        <div className="flex flex-col gap-1.5 bg-slate-950/85 backdrop-blur-md border border-sky-400/50 p-3.5 rounded-xl shadow-xl shadow-cyan-950/40 min-w-[250px]">
          <div className="flex items-center justify-between">
            <span className="font-cinzel font-bold text-sm tracking-widest text-sky-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f0ff]" />
              G-ONE :: GUARDIAN
            </span>
            <span className="text-xs text-amber-300 font-mono">
              HP: {playerHealth.current} / {playerHealth.max}
            </span>
          </div>

          {/* Player Core Indicators */}
          <div className="flex gap-2 mt-1">
            {Array.from({ length: playerHealth.max }).map((_, idx) => {
              const isFilled = idx < playerHealth.current;
              return (
                <div
                  key={idx}
                  className={`h-4 flex-1 rounded border transition-all duration-300 relative overflow-hidden ${
                    isFilled
                      ? 'bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-300 border-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.8)]'
                      : 'bg-slate-900/80 border-slate-700/50 opacity-30'
                  }`}
                >
                  {isFilled && <div className="absolute inset-0 bg-white/40 animate-pulse" />}
                </div>
              );
            })}
          </div>

          {/* Overdrive Meter */}
          <div className="mt-1 flex flex-col gap-0.5">
            <div className="flex justify-between text-[11px] font-mono tracking-wider text-slate-400">
              <span className="font-cinzel text-[10px] tracking-wider text-amber-400/90">DIVINE OVERDRIVE [E]</span>
              <span className={overdrive.charge >= 100 ? 'text-amber-300 font-bold animate-pulse' : 'text-slate-400'}>
                {overdrive.isActive ? 'ACTIVE' : `${overdrive.charge}%`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80">
              <div
                className={`h-full transition-all duration-200 ${
                  overdrive.isActive
                    ? 'bg-gradient-to-r from-amber-400 via-sky-300 to-cyan-400 animate-pulse w-full'
                    : 'bg-gradient-to-r from-cyan-500 to-amber-400'
                }`}
                style={{ width: overdrive.isActive ? '100%' : `${overdrive.charge}%` }}
              />
            </div>
          </div>

          {/* Active Relic Indicators */}
          {activeRelics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-800">
              {activeRelics.map((relic) => (
                <div
                  key={relic.id}
                  className="bg-amber-950/40 border border-amber-400/60 rounded px-2 py-0.5 text-[10px] font-cinzel text-amber-300 flex items-center gap-1.5 shadow-sm"
                >
                  <Award className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>{relic.name.toUpperCase()}</span>
                  {relic.charges !== undefined ? (
                    <span className="font-mono text-cyan-300 font-bold">({relic.charges}x)</span>
                  ) : (
                    <span className="font-mono text-slate-300">{Math.ceil(relic.remainingMs / 1000)}s</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center: Arena Title & Pause Button */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-5 py-2 rounded-b-xl flex flex-col items-center shadow-xl">
            <span className="font-cinzel text-[11px] tracking-[0.2em] text-amber-400/90 uppercase">
              {levelInfo.subtitle}
            </span>
            <span className="font-cinzel font-bold text-sm md:text-base tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-slate-100 to-red-400">
              {levelInfo.name}
            </span>
          </div>

          <button
            onClick={handlePause}
            className="pointer-events-auto mt-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 p-2.5 rounded-full text-slate-300 hover:text-amber-300 transition-all shadow-md active:scale-95"
            title="Pause Game [ESC]"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        {/* Right: RA-ONE Destroyer Health Units */}
        <div className="flex flex-col gap-1.5 bg-slate-950/85 backdrop-blur-md border border-red-500/50 p-3.5 rounded-xl shadow-xl shadow-red-950/40 min-w-[250px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300 font-mono">
              HP: {bossHealth.current} / {bossHealth.max}
            </span>
            <span className="font-cinzel font-bold text-sm tracking-widest text-red-500 flex items-center gap-2">
              RA-ONE :: DESTROYER
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ff0033]" />
            </span>
          </div>

          {/* Boss Segmented Units */}
          <div className="flex gap-1.5 mt-1">
            {Array.from({ length: bossHealth.max }).map((_, idx) => {
              const isFilled = idx < bossHealth.current;
              return (
                <div
                  key={idx}
                  className={`h-4 flex-1 rounded border transition-all duration-300 relative overflow-hidden ${
                    isFilled
                      ? 'bg-gradient-to-r from-red-700 via-rose-500 to-amber-500 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                      : 'bg-slate-900/80 border-slate-800 opacity-25'
                  }`}
                >
                  {isFilled && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                </div>
              );
            })}
          </div>

          <div className="text-right text-[11px] font-mono tracking-widest text-red-400/90 mt-1">
            {bossHealth.current === 1 ? 'CRITICAL RAGNAROK CORE' : 'NORDIC RUNIC POWER ACTIVE'}
          </div>
        </div>
      </div>

      {/* Bottom Footer: Ability Cooldown Badges & Key Reference */}
      <div className="w-full flex justify-center items-end gap-2 md:gap-3 pb-2 flex-wrap">
        {/* Pulse Shot */}
        <div className="relative bg-slate-900/85 border border-slate-700 rounded-lg p-2 flex items-center gap-2 min-w-[105px] overflow-hidden shadow-md">
          <Zap className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-xs font-cinzel font-bold text-slate-200">PULSE</span>
            <span className="text-[10px] text-cyan-400 font-mono">[L-CLICK / J]</span>
          </div>
          {getCooldownPercent(cooldowns.pulseShot) > 0 && (
            <div
              className="absolute inset-0 bg-slate-950/85 border-t border-cyan-400 pointer-events-none transition-all duration-100"
              style={{ height: `${getCooldownPercent(cooldowns.pulseShot)}%` }}
            />
          )}
        </div>

        {/* Aegis Shield */}
        <div
          className={`relative bg-slate-900/85 border rounded-lg p-2 flex items-center gap-2 min-w-[105px] overflow-hidden transition-colors shadow-md ${
            cooldowns.aegisShield.active
              ? 'border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)] bg-amber-950/40'
              : 'border-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-xs font-cinzel font-bold text-slate-200">AEGIS</span>
            <span className="text-[10px] text-amber-400 font-mono">[R-CLICK / K]</span>
          </div>
          {getCooldownPercent(cooldowns.aegisShield) > 0 && !cooldowns.aegisShield.active && (
            <div
              className="absolute inset-0 bg-slate-950/85 border-t border-amber-400 pointer-events-none transition-all duration-100"
              style={{ height: `${getCooldownPercent(cooldowns.aegisShield)}%` }}
            />
          )}
        </div>

        {/* Arc Burst */}
        <div className="relative bg-slate-900/85 border border-slate-700 rounded-lg p-2 flex items-center gap-2 min-w-[105px] overflow-hidden shadow-md">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-xs font-cinzel font-bold text-slate-200">ARC BURST</span>
            <span className="text-[10px] text-cyan-400 font-mono">[KEY L]</span>
          </div>
          {getCooldownPercent(cooldowns.arcBurst) > 0 && (
            <div
              className="absolute inset-0 bg-slate-950/85 border-t border-cyan-400 pointer-events-none transition-all duration-100"
              style={{ height: `${getCooldownPercent(cooldowns.arcBurst)}%` }}
            />
          )}
        </div>

        {/* Tactical Dash */}
        <div className="relative bg-slate-900/85 border border-slate-700 rounded-lg p-2 flex items-center gap-2 min-w-[105px] overflow-hidden shadow-md">
          <Wind className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-xs font-cinzel font-bold text-slate-200">DASH</span>
            <span className="text-[10px] text-cyan-400 font-mono">[SHIFT]</span>
          </div>
          {getCooldownPercent(cooldowns.dash) > 0 && (
            <div
              className="absolute inset-0 bg-slate-950/85 border-t border-cyan-400 pointer-events-none transition-all duration-100"
              style={{ height: `${getCooldownPercent(cooldowns.dash)}%` }}
            />
          )}
        </div>

        {/* Overdrive Trigger */}
        <div
          className={`relative rounded-lg p-2 flex items-center gap-2 min-w-[115px] border transition-all shadow-md ${
            overdrive.charge >= 100 || overdrive.isActive
              ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.7)] animate-pulse text-amber-200'
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
        >
          <Flame className={`w-4 h-4 ${overdrive.charge >= 100 ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
          <div className="flex flex-col">
            <span className="text-xs font-cinzel font-bold">OVERDRIVE</span>
            <span className="text-[10px] font-mono">[KEY E]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
