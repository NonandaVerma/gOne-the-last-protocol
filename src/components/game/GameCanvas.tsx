'use client';

import React, { useEffect, useRef, useState } from 'react';

interface GameCanvasProps {
  onGameReady?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onGameReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const [initError, setInitError] = useState(false);

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
        if (isMounted) setInitError(true);
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
      {/* No max-width/aspect cap: the container is the full viewport, and
          Phaser's ENVELOP scale mode (see gameConfig.ts) covers it edge to
          edge on any aspect ratio instead of letterboxing to 16:9. */}
      <div
        id="game-container"
        ref={containerRef}
        tabIndex={0}
        style={{ outline: 'none' }}
        className="w-full h-full shadow-2xl relative outline-none focus:outline-none"
      />

      {initError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-obsidian">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <span className="hud-label text-order-cyan">Protocol failed to initialise</span>
            <p className="font-ui text-sm text-muted max-w-sm">
              Your browser could not start the rendering engine. This usually clears up on a reload.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="focus-protocol px-6 py-3 border border-order-cyan bg-graphite text-white hover:bg-order-ice hover:text-obsidian transition-colors duration-200 font-display font-bold text-sm tracking-[0.2em] uppercase"
            >
              Reload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
