'use client';

import React, { useEffect, useState } from 'react';
import { Flame, Pause, Shield, Sparkles, Wind, Zap } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { ActiveRelicState } from '../../game/types/game';
import { LevelState, LevelMetadata } from '../../game/systems/LevelState';
import { SeamSigil } from '../ui/Seam';
import { TutorialPanel } from './TutorialPanel';
import { NarrationOverlay } from './NarrationOverlay';

interface CooldownInfo {
  current: number;
  max: number;
  active?: boolean;
}

/* ------------------------------------------------------------------ */
/* Segmented core readout — one notched cell per health unit.          */
/* ------------------------------------------------------------------ */
const CoreUnits: React.FC<{
  current: number;
  max: number;
  faction: 'order' | 'entropy' | 'verdant';
}> = ({ current, max, faction }) => (
  <div className="flex gap-1.5" role="img" aria-label={`${current} of ${max} units remaining`}>
    {Array.from({ length: max }).map((_, idx) => {
      const filled = idx < current;
      return (
        <div
          key={idx}
          className={[
            'h-3.5 flex-1 min-w-[10px] border transition-all duration-300',
            'clip-notch',
            filled
              ? faction === 'order'
                ? 'bg-gradient-to-b from-order-ice via-order-cyan to-order-blue border-order-cyan shadow-[0_0_10px_rgba(0,207,255,0.6)]'
                : faction === 'verdant'
                ? 'bg-gradient-to-b from-emerald-300 via-emerald-500 to-teal-800 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                : 'bg-gradient-to-b from-entropy-hi via-entropy-crimson to-entropy-red border-entropy-crimson shadow-[0_0_10px_rgba(255,36,61,0.55)]'
              : 'bg-graphite/80 border-steel/20 opacity-40',
          ].join(' ')}
        />
      );
    })}
  </div>
);

interface ContextualStatus {
  label: string;
  value: string;
  alert?: boolean;
}

/* ------------------------------------------------------------------ */
/* Ability cell — compact, streamlined low-profile design.           */
/* ------------------------------------------------------------------ */
const AbilityCell: React.FC<{
  icon: React.ReactNode;
  label: string;
  binding: string;
  percent: number;
  active?: boolean;
  ready?: boolean;
  isLevel2?: boolean;
  isLevel3?: boolean;
}> = ({ icon, label, binding, percent, active = false, ready = true, isLevel2 = false, isLevel3 = false }) => (
  <div
    className={[
      'relative overflow-hidden clip-notch border px-2 py-1 min-w-[78px] md:min-w-[90px]',
      'flex items-center gap-1.5 transition-all duration-200 backdrop-blur-xs',
      active
        ? isLevel3
          ? 'border-emerald-400 bg-emerald-950/80 shadow-[0_0_14px_-2px_rgba(16,185,129,0.7)]'
          : isLevel2
          ? 'border-entropy-crimson bg-entropy-deep/90 shadow-[0_0_14px_-2px_rgba(255,36,61,0.7)]'
          : 'border-order-cyan bg-order-deep/90 shadow-[0_0_14px_-2px_rgba(0,207,255,0.7)]'
        : ready
        ? isLevel3
          ? 'border-emerald-500/30 bg-graphite/80'
          : isLevel2
          ? 'border-entropy-crimson/25 bg-graphite/80'
          : 'border-steel/25 bg-graphite/80'
        : 'border-steel/15 bg-graphite/60',
    ].join(' ')}
  >
    <span className={active || ready ? (active && isLevel3 ? 'text-emerald-300' : active && isLevel2 ? 'text-entropy-crimson' : isLevel3 ? 'text-emerald-400' : 'text-order-cyan') : 'text-steel/40'}>
      {icon}
    </span>
    <div className="flex flex-col leading-none">
      <span className="font-ui font-bold text-[0.62rem] tracking-[0.1em] uppercase text-paper">
        {label}
      </span>
      <span className="font-ui text-[0.52rem] tracking-wider text-muted/70">{binding}</span>
    </div>

    {/* Recovery wipe — shrinks as the cooldown drains */}
    {percent > 0 && !active && (
      <div
        className="absolute inset-x-0 top-0 bg-obsidian/88 border-b border-order-cyan/70 pointer-events-none transition-[height] duration-100"
        style={{ height: `${percent}%` }}
      />
    )}
  </div>
);

export const GameHUD: React.FC = () => {
  const [playerHealth, setPlayerHealth] = useState({ current: 3, max: 3 });
  const [bossHealth, setBossHealth] = useState({ current: 8, max: 8 });
  const [bossActive, setBossActive] = useState(false);
  const [bossPhase, setBossPhase] = useState<number>(1);
  const [contextualStatus, setContextualStatus] = useState<ContextualStatus | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelMetadata>(() => LevelState.get());
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
    // Initial sync with authoritative state on mount
    setLevelInfo(LevelState.get());
    EventBus.emit('request-level-sync');

    const handlePlayerHealth = (data: { current: number; max: number }) => setPlayerHealth(data);
    const handleBossHealth = (data: { current: number; max: number }) => {
      setBossHealth(data);
      if (data.current < data.max) setBossActive(true);
    };
    const handleBossState = (data: { state?: string } | string) => {
      const s = typeof data === 'string' ? data : data?.state;
      if (s === 'active' || s === 'telegraph' || s === 'attack' || s === 'recover' || s === 'stagger') {
        setBossActive(true);
      } else if (s === 'defeated') {
        setBossActive(false);
      }
    };
    const handleBossPhase = (data: { phase: number }) => {
      if (data && typeof data.phase === 'number') {
        setBossPhase(data.phase);
      }
    };
    const handleLevelLoaded = (data: { level: number; name: string; subtitle: string }) => {
      LevelState.set(data);
      setLevelInfo(data);
      setBossActive(data.level > 1);
      setContextualStatus(null);
    };
    const handleContextualStatus = (data: ContextualStatus | null) => {
      setContextualStatus(data);
    };
    const handleOverdrive = (data: { charge: number; isActive: boolean }) => setOverdrive(data);
    const handleCooldowns = (data: any) => setCooldowns(data);
    const handleActiveRelics = (data: ActiveRelicState[]) => setActiveRelics(data);

    EventBus.on(GAME_EVENTS.PLAYER_HEALTH_CHANGED, handlePlayerHealth);
    EventBus.on(GAME_EVENTS.BOSS_HEALTH_CHANGED, handleBossHealth);
    EventBus.on(GAME_EVENTS.BOSS_STATE_CHANGED, handleBossState);
    EventBus.on(GAME_EVENTS.BOSS_PHASE_CHANGED, handleBossPhase);
    EventBus.on(GAME_EVENTS.LEVEL_LOADED, handleLevelLoaded);
    EventBus.on(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, handleContextualStatus);
    EventBus.on(GAME_EVENTS.OVERDRIVE_CHANGED, handleOverdrive);
    EventBus.on(GAME_EVENTS.COOLDOWNS_CHANGED, handleCooldowns);
    EventBus.on(GAME_EVENTS.ACTIVE_RELICS_CHANGED, handleActiveRelics);

    return () => {
      EventBus.off(GAME_EVENTS.PLAYER_HEALTH_CHANGED, handlePlayerHealth);
      EventBus.off(GAME_EVENTS.BOSS_HEALTH_CHANGED, handleBossHealth);
      EventBus.off(GAME_EVENTS.BOSS_STATE_CHANGED, handleBossState);
      EventBus.off(GAME_EVENTS.BOSS_PHASE_CHANGED, handleBossPhase);
      EventBus.off(GAME_EVENTS.LEVEL_LOADED, handleLevelLoaded);
      EventBus.off(GAME_EVENTS.CONTEXTUAL_STATUS_CHANGED, handleContextualStatus);
      EventBus.off(GAME_EVENTS.OVERDRIVE_CHANGED, handleOverdrive);
      EventBus.off(GAME_EVENTS.COOLDOWNS_CHANGED, handleCooldowns);
      EventBus.off(GAME_EVENTS.ACTIVE_RELICS_CHANGED, handleActiveRelics);
    };
  }, []);

  const handlePause = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    EventBus.emit(GAME_EVENTS.PAUSE_GAME);
  };

  const cdPercent = (cd: CooldownInfo) =>
    cd.current <= 0 ? 0 : Math.min(100, Math.round((cd.current / cd.max) * 100));

  const overdriveReady = overdrive.charge >= 100 || overdrive.isActive;
  /** Last unit left on either side — drives the critical readouts. */
  const bossCritical = bossHealth.current === 1;
  const playerCritical = playerHealth.current === 1;
  const isLevel2 = levelInfo.level === 2;
  const isLevel3 = levelInfo.level === 3;

  const bossTitle = isLevel3 ? 'The Worldseed Guardian' : isLevel2 ? 'The Last Warden' : 'Ra-One';

  return (
    <div className="absolute inset-0 pointer-events-none p-3 md:p-5 flex flex-col justify-between z-20 select-none">
      {/* ================= TOP ROW ================= */}
      <div className="w-full flex justify-between items-start gap-3">
        {/* ---- ORDER: G-One ---- */}
        <div
          className={`panel ${isLevel3 ? 'border-emerald-500/30' : isLevel2 ? 'border-entropy-crimson/30' : 'panel-order'} p-3 min-w-[220px] max-w-[280px] flex flex-col gap-2`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="hud-label text-order-cyan flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-order-cyan animate-pulse" />
              G-One
            </span>
            <span
              className={`font-ui text-[0.68rem] font-bold tabular-nums ${
                playerCritical ? 'text-entropy-crimson' : 'text-steel'
              }`}
            >
              {playerHealth.current}/{playerHealth.max}
            </span>
          </div>

          <CoreUnits current={playerHealth.current} max={playerHealth.max} faction="order" />

          {/* Overdrive meter */}
          <div className="flex flex-col gap-1 pt-0.5">
            <div className="flex justify-between items-baseline">
              <span className="hud-label text-[0.56rem] text-muted/70">Overdrive [E]</span>
              <span
                className={`font-ui text-[0.62rem] font-bold tabular-nums ${
                  overdriveReady ? 'text-order-ice' : 'text-muted/70'
                }`}
              >
                {overdrive.isActive ? 'ACTIVE' : `${overdrive.charge}%`}
              </span>
            </div>
            <div className="w-full h-1 bg-obsidian border border-steel/20 overflow-hidden">
              <div
                className={`h-full transition-[width] duration-200 ${
                  overdrive.isActive
                    ? 'bg-gradient-to-r from-order-ice via-order-cyan to-order-ice animate-pulse'
                    : 'bg-gradient-to-r from-order-blue to-order-cyan'
                }`}
                style={{ width: overdrive.isActive ? '100%' : `${overdrive.charge}%` }}
              />
            </div>
          </div>

          {/* Active fragments */}
          {activeRelics.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1.5 border-t border-steel/15">
              {activeRelics.map((relic) => (
                <span
                  key={relic.id}
                  className="clip-notch border border-order-cyan/40 bg-order-deep/70 px-1.5 py-0.5 flex items-center gap-1"
                >
                  <span className="font-ui text-[0.56rem] font-bold uppercase tracking-wider text-order-ice">
                    {relic.name}
                  </span>
                  <span className="font-ui text-[0.56rem] tabular-nums text-muted">
                    {relic.charges !== undefined
                      ? `${relic.charges}x`
                      : `${Math.ceil(relic.remainingMs / 1000)}s`}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ---- CENTRE: realm identity on the seam axis ---- */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div
            className={`panel px-5 py-2 flex flex-col items-center gap-0.5 ${
              isLevel3
                ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-graphite/90'
                : isLevel2
                ? 'border-entropy-crimson/40 shadow-[0_0_15px_rgba(255,36,61,0.2)]'
                : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <SeamSigil size={10} />
              <span
                className={`hud-label text-[0.56rem] ${
                  isLevel3 ? 'text-emerald-300/80' : 'text-muted/70'
                }`}
              >
                {levelInfo.subtitle}
              </span>
              <SeamSigil size={10} />
            </div>
            <span
              className={`font-display font-bold text-[0.7rem] md:text-xs tracking-[0.18em] text-center ${
                isLevel3 ? 'text-emerald-100' : isLevel2 ? 'text-amber-100' : 'text-paper'
              }`}
            >
              {levelInfo.name}
            </span>
          </div>

          {/* Contextual Status Indicator */}
          {contextualStatus && (
            <div
              className={`clip-notch px-3 py-0.5 border text-[0.58rem] font-ui font-semibold tracking-wider uppercase transition-all duration-300 flex items-center gap-1.5 backdrop-blur-xs ${
                contextualStatus.alert
                  ? isLevel3
                    ? 'bg-emerald-950/90 border-emerald-500 text-amber-300 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse'
                    : 'bg-entropy-deep/85 border-entropy-crimson text-entropy-hi shadow-[0_0_12px_rgba(255,36,61,0.5)] animate-pulse'
                  : isLevel3
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                  : 'bg-graphite/85 border-steel/30 text-amber-300'
              }`}
            >
              <span className="text-muted/70 text-[0.52rem]">{contextualStatus.label}:</span>
              <span className="font-bold">{contextualStatus.value}</span>
            </div>
          )}

          <button
            onClick={handlePause}
            title="Pause [ESC]"
            aria-label="Pause game"
            className="pointer-events-auto clip-notch border border-steel/25 bg-graphite/85 p-2 text-steel hover:text-order-cyan hover:border-order-cyan/60 transition-all active:scale-95 focus-protocol"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ---- ENTROPY / VERDANT: Ra-One / Last Warden / Worldseed Guardian ---- */}
        <div
          className={`panel ${
            isLevel3
              ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'panel-entropy'
          } p-3 min-w-[220px] max-w-[280px] flex flex-col gap-2 transition-all duration-500 ${
            bossActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-ui text-[0.68rem] font-bold tabular-nums text-steel">
              {bossHealth.current}/{bossHealth.max}
            </span>
            <span
              className={`hud-label flex items-center gap-1.5 ${
                isLevel3 ? 'text-emerald-400' : 'text-entropy-crimson'
              }`}
            >
              {bossTitle}
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isLevel3 ? 'bg-emerald-400' : 'bg-entropy-crimson'
                }`}
              />
            </span>
          </div>

          <CoreUnits
            current={bossHealth.current}
            max={bossHealth.max}
            faction={isLevel3 ? 'verdant' : 'entropy'}
          />

          <div className="flex items-center justify-between hud-label text-[0.54rem]">
            {isLevel3 ? (
              <span className="text-emerald-300/80">Deity Core</span>
            ) : isLevel2 ? (
              <span className="text-entropy-crimson/80">Phase {bossPhase}</span>
            ) : (
              <span className="text-muted/60">Anomalous</span>
            )}
            <div className="text-right">
              {bossCritical ? (
                <span
                  className={
                    isLevel3
                      ? 'text-amber-400 animate-pulse'
                      : 'text-entropy-crimson animate-pulse'
                  }
                >
                  {isLevel3 ? 'Containment Collapsing' : 'Core Destabilised'}
                </span>
              ) : (
                <span className="text-muted/60">
                  {isLevel3 ? 'Overgrowth Active' : 'Corruption Active'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= UPPER-LEFT TUTORIAL PANEL ================= */}
      <TutorialPanel />

      {/* ================= LOWER NARRATION & SUBTITLES ================= */}
      <NarrationOverlay />

      {/* ================= ABILITY RAIL ================= */}
      <div className="w-full flex justify-center items-end gap-1.5 flex-wrap pb-1">
        <AbilityCell
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Pulse"
          binding="LMB / J"
          percent={cdPercent(cooldowns.pulseShot)}
          isLevel2={isLevel2}
          isLevel3={isLevel3}
        />
        <AbilityCell
          icon={<Shield className="w-3.5 h-3.5" />}
          label="Aegis"
          binding="RMB / K"
          percent={cdPercent(cooldowns.aegisShield)}
          active={cooldowns.aegisShield.active}
          isLevel2={isLevel2}
          isLevel3={isLevel3}
        />
        <AbilityCell
          icon={<Sparkles className="w-3.5 h-3.5" />}
          label="Arc Burst"
          binding="L"
          percent={cdPercent(cooldowns.arcBurst)}
          isLevel2={isLevel2}
          isLevel3={isLevel3}
        />
        <AbilityCell
          icon={<Wind className="w-3.5 h-3.5" />}
          label="Phase Dash"
          binding="Shift"
          percent={cdPercent(cooldowns.dash)}
          isLevel2={isLevel2}
          isLevel3={isLevel3}
        />
        {isLevel3 && (
          <AbilityCell
            icon={<span className="text-emerald-400 font-bold text-xs">◈</span>}
            label="Rootline"
            binding="F / Click"
            percent={0}
            ready={true}
            isLevel3={true}
          />
        )}
        <AbilityCell
          icon={<Flame className="w-3.5 h-3.5" />}
          label="Overdrive"
          binding="E"
          percent={0}
          ready={overdriveReady}
          active={overdrive.isActive}
          isLevel2={isLevel2}
          isLevel3={isLevel3}
        />
      </div>
    </div>
  );
};
