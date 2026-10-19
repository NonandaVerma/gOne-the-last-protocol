'use client';

import React, { useState } from 'react';
import {
  Play,
  HelpCircle,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Sparkles,
  Wind,
  Crosshair,
  Award,
  Flame,
  Film,
  X,
} from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { AudioManager } from '../../game/systems/AudioManager';

interface MainMenuProps {
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onOpenSettings }) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'relics'>('controls');
  const [isMuted, setIsMuted] = useState(AudioManager.getInstance().isMuted());

  const handlePlayStory = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    AudioManager.getInstance().init();
    AudioManager.getInstance().resume();
    EventBus.emit(GAME_EVENTS.START_GAME);
  };

  const handleToggleSound = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const muted = AudioManager.getInstance().toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-6 md:p-10 z-30 select-none overflow-hidden">
      {/* High-Resolution Key Art Background with Vignette */}
      <img
        src="/images/bg_menu.png"
        alt="G-One: The Last Protocol"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-30 pointer-events-none mix-blend-luminosity scale-105 filter blur-[0.5px]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-none" />

      {/* Top Bar with Sound Toggle & Status */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10">
        <div className="text-xs font-cinzel tracking-widest text-sky-400/90 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-md flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          DIVINE GUARDIAN SYSTEM // OLYMPIAN PROTOCOL ACTIVE
        </div>
        <button
          onClick={handleToggleSound}
          className="flex items-center gap-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-400/80 px-3.5 py-1.5 rounded-md text-slate-300 hover:text-amber-300 transition-all text-xs font-cinzel"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          {isMuted ? 'AUDIO: MUTED' : 'AUDIO: ACTIVE'}
        </button>
      </div>

      {/* Hero Title Section */}
      <div className="flex flex-col items-center text-center max-w-3xl my-auto z-10">
        <div className="inline-block px-5 py-1.5 mb-4 rounded-full bg-sky-950/60 border border-sky-400/40 text-amber-300 text-xs tracking-[0.3em] font-cinzel uppercase shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          GREEK DIVINE GUARDIAN VS VIKING DESTROYER
        </div>

        <h1 className="font-cinzelDeco font-black text-6xl md:text-8xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-amber-200 to-rose-500 drop-shadow-[0_0_40px_rgba(56,189,248,0.5)]">
          G-ONE
        </h1>
        <h2 className="font-cinzel font-bold text-2xl md:text-3xl tracking-[0.3em] text-slate-200 mt-2">
          THE LAST PROTOCOL
        </h2>

        <p className="mt-5 font-cormorant text-slate-300 text-lg md:text-2xl max-w-2xl font-light italic leading-relaxed">
          &ldquo;When apocalyptic flames ignite the world, one celestial sentinel ascends with Athena’s shield and Zeus’s lightning to decide the fate of all creation.&rdquo;
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3.5 mt-8 w-full max-w-xl justify-center">
          <button
            onClick={handlePlayStory}
            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg font-cinzel font-bold text-base tracking-wider bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-400 hover:from-sky-400 hover:to-amber-300 text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.6)] transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            PLAY STORY
          </button>

          <button
            onClick={(e) => {
              e.currentTarget.blur();
              setShowTrailer(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-cinzel font-bold text-sm tracking-wider bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 hover:border-amber-300 text-amber-200 hover:text-amber-100 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
          >
            <Film className="w-4 h-4 text-amber-300" />
            WATCH TEASER
          </button>

          <button
            onClick={(e) => {
              e.currentTarget.blur();
              setShowHowToPlay(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-cinzel font-semibold text-sm tracking-wider bg-slate-950/90 hover:bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-all duration-200 shadow-md active:scale-95"
          >
            <HelpCircle className="w-4 h-4" />
            CONTROLS & RELICS
          </button>

          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSettings();
            }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-cinzel font-semibold text-sm tracking-wider bg-slate-950/90 hover:bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-all duration-200 shadow-md active:scale-95"
          >
            <SettingsIcon className="w-4 h-4" />
            SETTINGS
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs font-cinzel tracking-widest text-slate-400 z-10">
        THREE ARENAS // FUNCTIONAL RELICS // PHASER 4 ENGINE
      </div>

      {/* TEASER TRAILER MODAL */}
      {showTrailer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-4 md:p-8 z-50 animate-fade-in">
          <div className="relative w-full max-w-5xl bg-slate-950 border-2 border-amber-400/60 rounded-2xl p-4 shadow-[0_0_60px_rgba(245,158,11,0.4)] flex flex-col items-center gap-4">
            <div className="w-full flex justify-between items-center border-b border-slate-800 pb-2 px-2">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel font-bold text-sm md:text-base text-amber-200 tracking-widest">
                  OFFICIAL TEASER TRAILER // G-ONE: THE LAST PROTOCOL
                </h3>
              </div>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  setShowTrailer(false);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full relative aspect-video rounded-lg overflow-hidden bg-black shadow-inner border border-slate-800">
              <video
                src="/images/video_intro.mp4"
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="w-full flex justify-between items-center px-2">
              <span className="text-xs font-mono text-slate-400">
                1080P CINEMATIC // BGM & SOUND DESIGN
              </span>
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  setShowTrailer(false);
                  handlePlayStory(e);
                }}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-cinzel font-bold text-xs tracking-wider bg-gradient-to-r from-sky-500 to-amber-400 hover:from-sky-400 hover:to-amber-300 text-slate-950 shadow-md transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                ENTER CAMPAIGN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOW TO PLAY & RELICS MODAL */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="relative bg-slate-950 border border-sky-400/50 rounded-2xl max-w-2xl w-full p-6 shadow-[0_0_40px_rgba(56,189,248,0.3)] flex flex-col gap-4 max-h-[90vh] overflow-y-auto overflow-hidden">
            <img
              src="/images/bg_realms.png"
              alt="Six Realms of the Shattered Protocol"
              className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none mix-blend-luminosity filter blur-[0.5px]"
            />
            <div className="relative z-10 flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('controls')}
                  className={`px-4 py-1.5 rounded-md text-xs font-cinzel font-bold tracking-wider transition-colors ${
                    activeTab === 'controls'
                      ? 'bg-sky-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  GUARDIAN CONTROLS
                </button>
                <button
                  onClick={() => setActiveTab('relics')}
                  className={`px-4 py-1.5 rounded-md text-xs font-cinzel font-bold tracking-wider transition-colors ${
                    activeTab === 'relics'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  6 MYTHIC RELICS
                </button>
              </div>

              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-slate-400 hover:text-white font-cinzel text-xs px-2 py-1"
              >
                [CLOSE]
              </button>
            </div>

            {activeTab === 'controls' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                  <span className="font-cinzel font-bold text-sky-300 flex items-center gap-2">
                    <Wind className="w-4 h-4 text-cyan-400" /> MOVEMENT
                  </span>
                  <span className="text-slate-300 font-mono text-xs">A / D or Arrow Keys : Move</span>
                  <span className="text-slate-300 font-mono text-xs">W / Space : Jump / Air Thruster</span>
                  <span className="text-slate-300 font-mono text-xs">Shift : Tactical Dash (Invulnerable)</span>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                  <span className="font-cinzel font-bold text-sky-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" /> WEAPONS
                  </span>
                  <span className="text-slate-300 font-mono text-xs">Left-Click / J : Pulse Shot (aims at cursor)</span>
                  <span className="text-slate-300 font-mono text-xs">Key L : Arc Burst (Crescent Piercing Wave)</span>
                  <span className="text-slate-300 font-mono text-xs">Mouse Cursor : Precise Crosshair Aiming</span>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                  <span className="font-cinzel font-bold text-sky-300 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" /> AEGIS SHIELD
                  </span>
                  <span className="text-slate-300 font-mono text-xs">Right-Click / K : Shield Barrier</span>
                  <span className="text-slate-400 text-xs font-cormorant italic text-base">
                    Blocks 100% incoming damage and generates Overdrive charge on deflect.
                  </span>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                  <span className="font-cinzel font-bold text-sky-300 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" /> FINAL OVERDRIVE
                  </span>
                  <span className="text-slate-300 font-mono text-xs">Key E : Activate Overdrive (at 100%)</span>
                  <span className="text-slate-400 text-xs font-cormorant italic text-base">
                    Unleashes rapid double-damage pulse fire and radial shockwave!
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/40 flex flex-col gap-1">
                  <strong className="text-amber-300 font-cinzel">1. Aegis of Olympus</strong>
                  <p className="text-slate-300 font-cormorant text-sm">
                    Athena surrounds G-One with a celestial barrier absorbing up to 2 incoming hits.
                  </p>
                </div>

                <div className="bg-sky-950/30 p-2.5 rounded-lg border border-sky-500/40 flex flex-col gap-1">
                  <strong className="text-sky-300 font-cinzel">2. Thunderheart</strong>
                  <p className="text-slate-300 font-cormorant text-sm">
                    Zeus infuses your Pulse Shot with chain lightning dealing double damage for 10s.
                  </p>
                </div>

                <div className="bg-orange-950/30 p-2.5 rounded-lg border border-orange-500/40 flex flex-col gap-1">
                  <strong className="text-orange-300 font-cinzel">3. Phoenix Core</strong>
                  <p className="text-slate-300 font-cormorant text-sm">
                    Instantly restores 1 health unit (capped at the current arena’s maximum).
                  </p>
                </div>

                <div className="bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/40 flex flex-col gap-1">
                  <strong className="text-cyan-300 font-cinzel">4. Hermes&apos; Step</strong>
                  <p className="text-slate-300 font-cormorant text-sm">
                    Grants +40% movement speed and cuts dash cooldown in half with winged trails.
                  </p>
                </div>

                <div className="bg-purple-950/30 p-2.5 rounded-lg border border-purple-500/40 flex flex-col gap-1">
                  <strong className="text-purple-300 font-cinzel">5. Overdrive Shard</strong>
                  <p className="text-slate-300 font-cormorant text-sm">
                    Instantly grants +50 Overdrive meter to unleash Final Overdrive rapidly.
                  </p>
                </div>

                <div className="bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/40 flex flex-col gap-1">
                  <strong className="text-rose-300 font-cinzel">6. Rune of Ruin</strong>
                  <p className="text-slate-300 font-cormorant text-sm">
                    Risk / Reward: Grants +100% damage dealt, but causes you to take +1 extra damage.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-red-950/40 border border-red-900/60 p-3 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <strong className="text-red-400 font-cinzel">DECISIVE STAKES:</strong>
              <span className="font-cormorant text-sm">
                Chapter III (The Zero-Day Abyss) is a sudden-death 1-Hit battle. One blow decides the world!
              </span>
            </div>

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                setShowHowToPlay(false);
              }}
              className="mt-1 w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-amber-400 hover:from-sky-400 hover:to-amber-300 text-slate-950 font-cinzel font-bold tracking-wider text-sm shadow-md transition-all"
            >
              ACKNOWLEDGE PROTOCOL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
