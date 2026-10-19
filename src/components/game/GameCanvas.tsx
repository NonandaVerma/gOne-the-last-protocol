'use client';

import React, { useEffect, useRef } from 'react';

interface GameCanvasProps {
  onGameReady?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onGameReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);

  useEffect(() => {
    // Only initialize on the browser client
    if (typeof window === 'undefined' || !containerRef.current) return;

    let isMounted = true;

    // Prevent unwanted IME composition (e.g. Hindi/foreign input systems) while gaming
    const handleCompositionStart = (e: CompositionEvent) => {
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
      }
    };

    window.addEventListener('compositionstart', handleCompositionStart);

    // Prevent duplicate Phaser instances
    if (!gameRef.current) {
      Promise.all([
        import('phaser'),
        import('../../game/config/gameConfig'),
      ]).then(([PhaserModule, configModule]) => {
        if (!isMounted || !containerRef.current || gameRef.current) return;

        const config = configModule.createGameConfig(containerRef.current);
        const GameClass = PhaserModule.Game || (PhaserModule as any).default?.Game || PhaserModule;
        const game = new GameClass(config);
        gameRef.current = game;

        if (containerRef.current) {
          containerRef.current.focus();
        }

        if (onGameReady) {
          onGameReady();
        }
      }).catch((err) => {
        console.error('Failed to initialize Phaser game engine:', err);
      });
    }

    return () => {
      isMounted = false;
      window.removeEventListener('compositionstart', handleCompositionStart);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onGameReady]);

  const handleContainerClick = () => {
    // Blur any active DOM input/button so gameplay keys go directly to canvas
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    containerRef.current?.focus();
  };

  return (
    <div
      onClick={handleContainerClick}
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
    >
      <div
        id="game-container"
        ref={containerRef}
        tabIndex={0}
        style={{ outline: 'none' }}
        className="w-full h-full max-w-[1280px] max-h-[720px] aspect-video shadow-2xl relative outline-none focus:outline-none"
      />
    </div>
  );
};
