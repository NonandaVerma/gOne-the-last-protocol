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
import { LevelRevealCinematic, getRealmReveal } from '../components/game/LevelRevealCinematic';
import { LevelTransitionScreen } from '../components/game/LevelTransitionScreen';
import { SaveManager } from '../game/systems/SaveManager';

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
  const [transitionData, setTransitionData] = useState<{
    currentLevel: number;
    nextLevel: number;
    storyLines: string[];
  } | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const revealParam = parseInt(params.get('reveal') ?? '', 10);
      if (revealParam && getRealmReveal(revealParam)) {
        setShowIntro(false);
        setRevealLevel(revealParam);
        return;
      }
      if (params.get('state') === 'defeat' || params.get('defeat') === 'true') {
        setShowIntro(false);
        setGameState('DEFEAT');
        return;
      }
      if (params.get('state') === 'transition' || params.get('transition') === 'true') {
        setShowIntro(false);
        setTransitionData({
          currentLevel: 1,
          nextLevel: 2,
          storyLines: [
            'THE SKY-FORTRESS HAS FALLEN BEHIND YOU.',
            'CONSECRATED IRON AND VOLCANIC STONE ENGULF THE REALM.',
            'SIX SECTORS OF CORRUPTION BAR YOUR PATH TO THE WARDEN.',
          ],
        });
        setGameState('LEVEL_TRANSITION');
        return;
      }
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

    const handleLevelTransition = (data: {
      currentLevel: number;
      nextLevel: number;
      storyLines: string[];
    }) => {
      setTransitionData(data);
      setGameState('LEVEL_TRANSITION');
    };

    EventBus.on(GAME_EVENTS.GAME_STATE_CHANGED, handleStateChange);
    EventBus.on('play-realm-reveal', handlePlayReveal);
    EventBus.on('level-transition-start', handleLevelTransition);

    return () => {
      EventBus.off(GAME_EVENTS.GAME_STATE_CHANGED, handleStateChange);
      EventBus.off('play-realm-reveal', handlePlayReveal);
      EventBus.off('level-transition-start', handleLevelTransition);
    };
  }, []);

  const handleRevealFinish = () => {
    const nextLvl = revealLevel;
    setRevealLevel(null);
    if (nextLvl) {
      SaveManager.markRevealSeen(nextLvl);
      EventBus.emit('realm-reveal-finished', { level: nextLvl });
    }
  };

  const handleProceedTransition = () => {
    if (!transitionData) return;
    const { nextLevel } = transitionData;
    setTransitionData(null);
    EventBus.emit('proceed-level-transition', { nextLevel });
    if (getRealmReveal(nextLevel)) {
      setRevealLevel(nextLevel);
    } else {
      EventBus.emit(GAME_EVENTS.START_GAME, { level: nextLevel });
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

      {gameState === 'LEVEL_TRANSITION' && transitionData && (
        <LevelTransitionScreen
          currentLevel={transitionData.currentLevel}
          nextLevel={transitionData.nextLevel}
          storyLines={transitionData.storyLines}
          onProceed={handleProceedTransition}
        />
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
