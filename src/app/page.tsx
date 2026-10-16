'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GameState } from '../game/types/game';
import { EventBus, GAME_EVENTS } from '../game/systems/EventBus';
import { GameHUD } from '../components/game/GameHUD';
import { MainMenu } from '../components/game/MainMenu';
import { PauseMenu } from '../components/game/PauseMenu';
import { SettingsMenu } from '../components/game/SettingsMenu';
import { StoryOverlay } from '../components/game/StoryOverlay';
import { GameOverScreen } from '../components/game/GameOverScreen';
import { VictoryScreen } from '../components/game/VictoryScreen';
import { TouchControls } from '../components/game/TouchControls';

// Dynamically import GameCanvas with SSR disabled
const GameCanvas = dynamic(
  () => import('../components/game/GameCanvas').then((mod) => mod.GameCanvas),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black font-orbitron text-cyan-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="tracking-widest text-sm">LOADING CORE PROTOCOL...</span>
      </div>
    </div>
  )}
);

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('MAIN_MENU');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleStateChange = (state: GameState) => {
      setGameState(state);
    };

    EventBus.on(GAME_EVENTS.GAME_STATE_CHANGED, handleStateChange);

    return () => {
      EventBus.off(GAME_EVENTS.GAME_STATE_CHANGED, handleStateChange);
    };
  }, []);

  const handleResume = () => {
    EventBus.emit(GAME_EVENTS.RESUME_GAME);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
      {/* 1. Underlying Phaser Canvas */}
      <GameCanvas />

      {/* 2. CRT Scanline Shader Filter for Sci-Fi Retro Atmosphere */}
      <div className="scanlines absolute inset-0 pointer-events-none z-10" />

      {/* 3. React UI State Layers */}
      {gameState === 'MAIN_MENU' && (
        <MainMenu onOpenSettings={() => setShowSettings(true)} />
      )}

      {gameState === 'STORY_INTRO' && (
        <StoryOverlay />
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <>
          <GameHUD />
          <TouchControls />
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
    </main>
  );
}
