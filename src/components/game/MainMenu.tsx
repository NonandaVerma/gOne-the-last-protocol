'use client';

import React, { useState } from 'react';
import { Play, HelpCircle, Settings as SettingsIcon, Volume2, VolumeX, Shield, Zap, Sparkles, Wind, Crosshair } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { AudioManager } from '../../game/systems/AudioManager';

interface MainMenuProps {
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onOpenSettings }) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(AudioManager.getInstance().isMuted());

  const handlePlayStory = () => {
    AudioManager.getInstance().init();
    AudioManager.getInstance().resume();
    EventBus.emit(GAME_EVENTS.START_GAME);
  };

  const handleToggleSound = () => {
    const muted = AudioManager.getInstance().toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-8 z-30 font-rajdhani bg-gradient-to-b from-black/40 via-transparent to-black/80">
      {/* Top Bar with Sound Toggle */}
      <div className="w-full max-w-5xl flex justify-between items-center">
        <div className="text-xs font-mono tracking-widest text-cyan-400/80 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded">
          SYSTEM STATUS: ONLINE // PROTOCOL V1.0
        </div>
        <button
          onClick={handleToggleSound}
          className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 px-3 py-1.5 rounded-lg text-slate-300 hover:text-cyan-300 transition-all text-xs font-mono"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          {isMuted ? 'SOUND: OFF' : 'SOUND: ON'}
        </button>
      </div>

      {/* Hero Title Section */}
      <div className="flex flex-col items-center text-center max-w-3xl my-auto">
        <div className="inline-block px-4 py-1 mb-3 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs tracking-[0.3em] font-orbitron uppercase shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          Two Forces. Three Arenas. One Final Protocol.
        </div>

        <h1 className="font-orbitron font-black text-5xl md:text-7xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-red-500 drop-shadow-[0_0_35px_rgba(0,240,255,0.4)]">
          G-ONE
        </h1>
        <h2 className="font-orbitron font-bold text-2xl md:text-3xl tracking-[0.25em] text-slate-300 mt-1">
          THE LAST PROTOCOL
        </h2>

        <p className="mt-4 text-slate-400 text-sm md:text-base max-w-xl font-light italic leading-relaxed">
          &ldquo;When machines choose the fate of worlds, one guardian must choose what it means to be human.&rdquo;
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full max-w-md justify-center">
          <button
            onClick={handlePlayStory}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg font-orbitron font-bold text-base tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            PLAY STORY
          </button>

          <button
            onClick={() => setShowHowToPlay(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-orbitron font-semibold text-sm tracking-wider bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all duration-200"
          >
            <HelpCircle className="w-4 h-4" />
            HOW TO PLAY
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-orbitron font-semibold text-sm tracking-wider bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all duration-200"
          >
            <SettingsIcon className="w-4 h-4" />
            SETTINGS
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 tracking-wider">
        KEYBOARD & MOUSE COMBAT // SUPPORTS ALL RESOLUTIONS
      </div>

      {/* HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-cyan-500/50 rounded-xl max-w-xl w-full p-6 shadow-[0_0_30px_rgba(0,240,255,0.25)] flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-orbitron font-bold text-xl text-cyan-400 tracking-wider flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-cyan-400" />
                GUARDIAN PROTOCOL CONTROLS
              </h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                [ESC / CLOSE]
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
                <span className="font-orbitron font-semibold text-cyan-300 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-400" /> MOVEMENT
                </span>
                <span className="text-slate-300 font-mono text-xs">A / D or Left / Right : Move</span>
                <span className="text-slate-300 font-mono text-xs">W / Space : Jump</span>
                <span className="text-slate-300 font-mono text-xs">Shift : Tactical Dash (Invulnerable)</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
                <span className="font-orbitron font-semibold text-cyan-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" /> WEAPONS
                </span>
                <span className="text-slate-300 font-mono text-xs">Left-Click / J : Pulse Shot (aims at cursor)</span>
                <span className="text-slate-300 font-mono text-xs">Key L : Arc Burst (Heavy Wave)</span>
                <span className="text-slate-300 font-mono text-xs">Mouse Pointer : Precise Crosshair Aiming</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
                <span className="font-orbitron font-semibold text-cyan-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" /> DEFENSE
                </span>
                <span className="text-slate-300 font-mono text-xs">Right-Click / K : Aegis Shield</span>
                <span className="text-slate-400 text-xs">Blocks 100% incoming damage while barrier is active.</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
                <span className="font-orbitron font-semibold text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> OVERDRIVE
                </span>
                <span className="text-slate-300 font-mono text-xs">Key E : Final Overdrive</span>
                <span className="text-slate-400 text-xs">Charge by landing hits. Unleashes high-speed firepower and invulnerability!</span>
              </div>
            </div>

            <div className="bg-red-950/40 border border-red-900/60 p-3 rounded-lg text-xs text-red-300">
              <strong className="text-red-400">WARNING:</strong> Level 3 (The Zero-Day Abyss) is a decisive 1-Hit battle. One single hit decides the fate of the world!
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="mt-2 w-full py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-bold tracking-wider text-sm transition-colors"
            >
              ACKNOWLEDGE PROTOCOL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
