'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  Film,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { AudioManager } from '../../game/systems/AudioManager';
import { SaveManager } from '../../game/systems/SaveManager';
import { LEVELS } from '../../game/data/levels';
import { ProtocolButton } from '../ui/ProtocolButton';
import { ModalShell } from '../ui/ModalShell';
import { SeamDivider, SeamSigil, VerticalSeam } from '../ui/Seam';
import { HowToPlayModal } from './HowToPlayModal';
import { LevelRevealCinematic, getRealmReveal } from './LevelRevealCinematic';

interface MainMenuProps {
  onOpenSettings: () => void;
}

/** Deterministic particle field — fixed values avoid SSR hydration mismatch. */
const EMBERS = [
  { x: 8, d: 15, delay: 0, s: 2, order: true }, { x: 17, d: 21, delay: 4, s: 1.5, order: true },
  { x: 24, d: 18, delay: 8, s: 2.5, order: true }, { x: 31, d: 24, delay: 2, s: 1.5, order: true },
  { x: 38, d: 19, delay: 11, s: 2, order: true }, { x: 45, d: 23, delay: 6, s: 1.5, order: true },
  { x: 55, d: 20, delay: 3, s: 2, order: false }, { x: 62, d: 17, delay: 9, s: 2.5, order: false },
  { x: 69, d: 22, delay: 1, s: 1.5, order: false }, { x: 76, d: 16, delay: 13, s: 2, order: false },
  { x: 84, d: 25, delay: 5, s: 1.5, order: false }, { x: 92, d: 19, delay: 10, s: 2, order: false },
];

export const MainMenu: React.FC<MainMenuProps> = ({ onOpenSettings }) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  /** 0 = idle, climbs to 1 while the start transition charges the seam. */
  const [charge, setCharge] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  /** Realm whose reveal cinematic is currently showing, or null. */
  const [revealLevel, setRevealLevel] = useState<number | null>(null);
  const startedRef = useRef(false);

  /* Client-only state: read after mount so the server render stays stable. */
  useEffect(() => {
    setMounted(true);
    setIsMuted(AudioManager.getInstance().isMuted());
    setUnlockedLevel(SaveManager.getUnlockedLevel());
    setIsFullscreen(Boolean(document.fullscreenElement));

    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  /** Charge the dimensional seam, then hand off to the existing Phaser flow. */
  const proceedToGame = useCallback((level: number, immediate = false) => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || immediate) {
      EventBus.emit(GAME_EVENTS.START_GAME, { level });
      return;
    }

    setCharge(1);
    window.setTimeout(() => {
      EventBus.emit(GAME_EVENTS.START_GAME, { level });
    }, 550);
  }, []);

  /**
   * Start transition. `level` > 1 resumes at a previously unlocked realm.
   *
   * A realm with a reveal cinematic (currently only Realm 1) plays it before
   * the seam-charge handoff; realms without footage proceed straight through.
   */
  const initiate = useCallback((level = 1) => {
    if (startedRef.current) return;
    startedRef.current = true;

    const audio = AudioManager.getInstance();
    audio.init();
    audio.resume();

    if (getRealmReveal(level)) {
      setRevealLevel(level);
      return;
    }

    proceedToGame(level);
  }, [proceedToGame]);

  const handleRevealFinish = useCallback(() => {
    const level = revealLevel ?? 1;
    setRevealLevel(null);
    proceedToGame(level, true);
  }, [revealLevel, proceedToGame]);

  /* "PRESS ANY KEY TO BEGIN" — honour the promise printed in the key art. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The reveal cinematic owns Space/Enter while it is on screen.
      if (showTrailer || showHowToPlay || startedRef.current || revealLevel !== null) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        initiate(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [initiate, showTrailer, showHowToPlay, revealLevel]);

  const toggleSound = () => setIsMuted(AudioManager.getInstance().toggleMute());

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* Browser refused (iOS Safari, permissions) — leave state as reported. */
    }
  };

  /** Clears saved realm progress so a returning player can start clean. */
  const confirmRestartGame = () => {
    SaveManager.resetProgress();
    setUnlockedLevel(1);
    setShowResetConfirm(false);
  };

  const canContinue = mounted && unlockedLevel > 1;
  const continueName = LEVELS[unlockedLevel]?.name ?? '';

  return (
    <div className="absolute inset-0 z-30 overflow-hidden select-none">
      {/* ==================================================================
          CINEMATIC BACKDROP — the teaser key art, kept legible and dominant
          ================================================================== */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/images/landing-bg.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-[center_top] will-change-transform"
        />

        {/* Edge scrims only — the centre (logo + both characters) stays clear. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(7,10,15,0.35)_100%)] pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-[12%] bg-gradient-to-r from-obsidian/40 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-[12%] bg-gradient-to-l from-obsidian/40 to-transparent pointer-events-none" />
        {/* Lower scrim: hosts the controls and masks the art's baked-in
            lore block and "press any key" strip so text never doubles up. */}
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-obsidian/85 via-obsidian/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[10%] bg-gradient-to-b from-obsidian/45 to-transparent pointer-events-none" />
      </div>

      {/* Faction energy breathing over each character's core */}
      <div
        className="absolute left-[23%] top-[52%] w-56 h-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-order-cyan animate-core-pulse pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute left-[78%] top-[34%] w-72 h-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-entropy-crimson animate-fissure-pulse pointer-events-none"
        aria-hidden="true"
      />

      {/* Energy motes drifting toward the viewer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {EMBERS.map((p, i) => (
          <span
            key={i}
            className={`absolute bottom-0 rounded-full animate-drift-up ${
              p.order ? 'bg-order-cyan' : 'bg-entropy-crimson'
            }`}
            style={{
              left: `${p.x}%`,
              width: `${p.s}px`,
              height: `${p.s}px`,
              animationDuration: `${p.d}s`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 8px 2px ${p.order ? 'rgba(0,207,255,0.6)' : 'rgba(255,36,61,0.6)'}`,
            }}
          />
        ))}
      </div>

      {/* No persistent centre line: the key art already contains its own
          dimensional crack, and a second drawn seam read as a UI artefact
          cutting the composition in half. The element now exists only as the
          transient start-transition flare. */}
      {charge > 0 && <VerticalSeam intensity={charge} animate={false} />}

      {/* Dark dissolve transition — eliminates the white flash completely */}
      <div
        className="absolute inset-0 bg-obsidian pointer-events-none z-40 transition-opacity duration-500"
        style={{ opacity: charge }}
        aria-hidden="true"
      />

      {/* ==================================================================
          FOREGROUND INTERFACE
          ================================================================== */}
      <div className="relative z-30 h-full flex flex-col justify-between p-3 sm:p-5 md:p-6 lg:p-7">
        {/* ---- Minimal top bar ---- */}
        <header className="flex items-start justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2.5 panel px-3.5 py-2">
            <SeamSigil size={15} />
            <span className="hud-label text-steel">
              Protocol <span className="text-order-cyan">Online</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-order-cyan animate-pulse" />
          </div>

          <nav className="flex items-center gap-2" aria-label="Title screen options">
            <ProtocolButton
              size="sm"
              variant="ghost"
              onClick={toggleSound}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              icon={isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio'}</span>
            </ProtocolButton>

            <ProtocolButton
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              icon={
                isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />
              }
            >
              <span className="hidden sm:inline">{isFullscreen ? 'Windowed' : 'Fullscreen'}</span>
            </ProtocolButton>

            <ProtocolButton
              size="sm"
              variant="ghost"
              onClick={onOpenSettings}
              icon={<SettingsIcon className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Settings</span>
            </ProtocolButton>
          </nav>
        </header>

        {/* The artwork carries the title lockup; this keeps the page
            semantically and assistively titled without drawing over it. */}
        <h1 className="sr-only">G-One: The Last Protocol</h1>

        {/* ---- Action cluster, seated in the lower scrim ----
             The top offset clears the metallic rule beneath the key art's
             "THE LAST PROTOCOL" lockup, which the tagline bar was otherwise
             sitting on top of. Viewport-relative so it holds as the art
             rescales, clamped so it never collapses or runs into the footer.
             Tune the 8vh if the ornament still reads tight. */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 pb-1 mt-[clamp(70px,12vh,150px)]">
          {/* Telemetry banner matching the exact notched geometry & typography of ProtocolButton */}
          <div className="clip-notch relative inline-flex items-center gap-2.5 px-5 py-2 border border-order-cyan/40 bg-graphite/90 backdrop-blur-md shadow-[0_0_20px_-6px_rgba(0,207,255,0.45)] animate-rise-in">
            <span className="w-1.5 h-1.5 rotate-45 bg-order-cyan shadow-[0_0_6px_#00cfff] shrink-0" />
            <span className="font-ui font-bold text-xs tracking-[0.24em] uppercase text-paper">
              Reality is fracturing
            </span>
            <span className="text-order-cyan font-bold mx-1 opacity-80">{'//'}</span>
            <span className="font-ui font-bold text-xs tracking-[0.24em] uppercase text-order-ice">
              Choose the force that will survive
            </span>
            <span className="w-1.5 h-1.5 rotate-45 bg-entropy-crimson shadow-[0_0_6px_#ff243d] shrink-0" />
          </div>




          <div className="w-full max-w-md animate-rise-in" style={{ animationDelay: '60ms' }}>
            <SeamDivider />
          </div>

          <ProtocolButton
            variant="order"
            size="lg"
            onClick={() => initiate(1)}
            trailing={<ChevronRight className="w-5 h-5" />}
            className="animate-rise-in min-w-[280px]"
            style={{ animationDelay: '120ms' }}
          >
            Initiate Protocol
          </ProtocolButton>

          <div
            className="flex flex-wrap items-center justify-center gap-2.5 animate-rise-in"
            style={{ animationDelay: '200ms' }}
          >
            {/* Resuming is progression, not an Entropy action — crimson is
                reserved for destructive and corruption-aligned controls. */}
            {canContinue && (
              <ProtocolButton variant="neutral" size="md" onClick={() => initiate(unlockedLevel)}>
                Continue · Realm {unlockedLevel}
                {continueName && (
                  <span className="hidden md:inline text-muted/70 normal-case font-normal ml-2">
                    {continueName}
                  </span>
                )}
              </ProtocolButton>
            )}

            {/* Only surfaced once there is saved progress to clear — a
                returning player's explicit way to play from Realm 1 without
                "Initiate Protocol" silently leaving Realm 4 banked underneath.
                Rest state matches the other secondary actions (Teaser, How to
                Play); the destructive step lives in the confirm modal, not
                the idle button colour. */}
            {canContinue && (
              <ProtocolButton
                variant="neutral"
                size="md"
                onClick={() => setShowResetConfirm(true)}
                icon={<RotateCcw className="w-4 h-4" />}
                aria-label="Restart game and clear saved progress"
              >
                Restart Game
              </ProtocolButton>
            )}

            <ProtocolButton
              variant="neutral"
              size="md"
              onClick={() => setShowTrailer(true)}
              icon={<Film className="w-4 h-4" />}
            >
              Teaser
            </ProtocolButton>

            <ProtocolButton variant="neutral" size="md" onClick={() => setShowHowToPlay(true)}>
              How to Play
            </ProtocolButton>
          </div>
        </div>

        {/* ---- Bottom information strip ---- */}
        <footer className="flex items-center justify-between gap-4 pt-4 text-[0.62rem] font-ui uppercase tracking-[0.22em] text-muted/55">
          <span>Protocol v1.0</span>
          <span className="hidden sm:flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 border border-steel/25 text-steel/80">Enter</kbd>
            to begin
          </span>
          <span>{Object.keys(LEVELS).length} Realms</span>
        </footer>
      </div>

      {/* ==================================================================
          TEASER MODAL
          ================================================================== */}
      {showTrailer && (
        <ModalShell
          title="Official Teaser"
          subtitle="Cinematic archive"
          faction="order"
          width="max-w-5xl"
          onClose={() => setShowTrailer(false)}
          footer={
            <div className="flex justify-end">
              <ProtocolButton
                variant="order"
                size="md"
                trailing={<ChevronRight className="w-4 h-4" />}
                onClick={() => {
                  setShowTrailer(false);
                  initiate(1);
                }}
              >
                Enter the Fracture
              </ProtocolButton>
            </div>
          }
        >
          <div className="relative aspect-video bg-black overflow-hidden">
            <video
              src="/images/video_intro.mp4"
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>
        </ModalShell>
      )}

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {/* ==================================================================
          REALM REVEAL — plays before gameplay for realms with footage
          ================================================================== */}
      {revealLevel !== null && (
        <LevelRevealCinematic level={revealLevel} onFinish={handleRevealFinish} />
      )}

      {/* ==================================================================
          RESTART GAME — CONFIRMATION
          ================================================================== */}
      {showResetConfirm && (
        <ModalShell
          title="Restart Game"
          subtitle="This cannot be undone"
          faction="entropy"
          width="max-w-sm"
          onClose={() => setShowResetConfirm(false)}
          footer={
            <div className="flex gap-2.5">
              <ProtocolButton
                variant="neutral"
                size="md"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                No, Keep Progress
              </ProtocolButton>
              <ProtocolButton
                variant="danger"
                size="md"
                onClick={confirmRestartGame}
                icon={<RotateCcw className="w-4 h-4" />}
                className="flex-1"
              >
                Yes, Restart
              </ProtocolButton>
            </div>
          }
        >
          <p className="font-body text-sm text-muted leading-relaxed">
            All saved progress will be lost, including your furthest unlocked realm
            {continueName ? (
              <>
                {' '}
                (<span className="text-paper font-semibold">Realm {unlockedLevel} — {continueName}</span>)
              </>
            ) : null}
            . You will start again from Realm 1. Are you sure you want to continue?
          </p>
        </ModalShell>
      )}
    </div>
  );
};
