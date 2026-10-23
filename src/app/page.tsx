'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GameState } from '../game/types/game';
import { EventBus, GAME_EVENTS } from '../game/systems/EventBus';
import { GameHUD } from '../components/game/GameHUD';
import { MainMenu } from '../components/game/MainMenu';
import { PauseMenu } from '../components/game/PauseMenu';
import { SettingsMenu } from '../components/game/SettingsMenu';
import { GameOverScreen } from '../components/game/GameOverScreen';
import { VictoryScreen } from '../components/game/VictoryScreen';
import { TouchControls } from '../components/game/TouchControls';
import { StageBanner } from '../components/game/StageBanner';
import { IntroCinematic } from '../components/game/IntroCinematic';
import { LevelRevealCinematic } from '../components/game/LevelRevealCinematic';

/** Session-scoped: the cinematic replays on a fresh browser session only. */
const INTRO_KEY = 'gone_intro_played_v1';

// Dynamically import GameCanvas with SSR disabled
const GameCanvas = dynamic(
  () => import('../components/game/GameCanvas').then((mod) => mod.GameCanvas),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-obsidian">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-order-cyan border-t-transparent animate-spin" />
        <span className="hud-label text-order-cyan">Initialising Protocol</span>
      </div>
    </div>
  )}
);

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('MAIN_MENU');
  const [showSettings, setShowSettings] = useState(false);
  /**
   * Starts false so the server render and first client render agree; the
   * effect below decides whether the cinematic is actually owed. Storing the
   * flag in sessionStorage (not localStorage) means a remount or re-render
   * never replays it, but a new session does.
   */
  const [showIntro, setShowIntro] = useState(false);
  const [revealLevel, setRevealLevel] = useState<number | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autoplay') === 'true' || params.get('skipIntro') === 'true') {
        setShowIntro(false);
        return;
      }
      if (!sessionStorage.getItem(INTRO_KEY)) setShowIntro(true);
    } catch {
      /* storage unavailable (private mode) — skip straight to the menu */
    }
  }, []);

  useEffect(() => {
    const handleStateChange = (state: GameState) => {
      setGameState(state);
    };

    const handlePlayReveal = (data: { level: number }) => {
      if (data?.level) {
        setRevealLevel(data.level);
      }
    };

    EventBus.on(GAME_EVENTS.GAME_STATE_CHANGED, handleStateChange);
    EventBus.on('play-realm-reveal', handlePlayReveal);

    return () => {
      EventBus.off(GAME_EVENTS.GAME_STATE_CHANGED, handleStateChange);
      EventBus.off('play-realm-reveal', handlePlayReveal);
    };
  }, []);

  const handleRevealFinish = () => {
    const nextLvl = revealLevel;
    setRevealLevel(null);
    if (nextLvl) {
      EventBus.emit('realm-reveal-finished', { level: nextLvl });
    }
  };

  const handleIntroFinish = () => {
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
    } catch {
      /* non-fatal */
    }
    setShowIntro(false);
  };

  const handleResume = () => {
    EventBus.emit(GAME_EVENTS.RESUME_GAME);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-obsidian flex items-center justify-center">
      {/* 1. Underlying Phaser Canvas */}
      <GameCanvas />

      {/* 2. CRT Scanline Shader Filter for Sci-Fi Retro Atmosphere */}
      <div className="scanlines absolute inset-0 pointer-events-none z-10" />

      {/* 3. React UI State Layers */}
      {gameState === 'MAIN_MENU' && (
        <MainMenu onOpenSettings={() => setShowSettings(true)} />
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <>
          <GameHUD />
          <TouchControls />
          <StageBanner />
        </>
      )}

      {gameState === 'PAUSED' && (
        <PauseMenu
          onResume={handleResume}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {gameState === 'DEFEAT' && (
        <GameOverScreen />
      )}

      {gameState === 'VICTORY' && (
        <VictoryScreen />
      )}

      {/* Settings Modal (available from MainMenu or PauseMenu) */}
      {showSettings && (
        <SettingsMenu onClose={() => setShowSettings(false)} />
      )}

      {/* 4. Opening cinematic — the single startup sequence, above everything
             until it is skipped or plays out. */}
      {showIntro && <IntroCinematic onFinish={handleIntroFinish} />}

      {/* 5. In-game Realm Reveal Cinematic — plays during realm progression */}
      {revealLevel !== null && (
        <LevelRevealCinematic
          level={revealLevel}
          onFinish={handleRevealFinish}
        />
      )}
    </main>
  );
}
