'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, Sliders, Eye, X, Maximize2 } from 'lucide-react';
import { GameSettings } from '../../game/types/game';
import { SaveManager } from '../../game/systems/SaveManager';
import { AudioManager } from '../../game/systems/AudioManager';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';

interface SettingsMenuProps {
  onClose: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<GameSettings>(SaveManager.getSettings());

  const handleMasterChange = (val: number) => {
    const updated = { ...settings, masterVolume: val };
    setSettings(updated);
    SaveManager.saveSettings(updated);
    AudioManager.getInstance().setVolumes(updated.masterVolume, updated.musicVolume, updated.sfxVolume);
  };

  const handleMusicChange = (val: number) => {
    const updated = { ...settings, musicVolume: val };
    setSettings(updated);
    SaveManager.saveSettings(updated);
    AudioManager.getInstance().setVolumes(updated.masterVolume, updated.musicVolume, updated.sfxVolume);
  };

  const handleSfxChange = (val: number) => {
    const updated = { ...settings, sfxVolume: val };
    setSettings(updated);
    SaveManager.saveSettings(updated);
    AudioManager.getInstance().setVolumes(updated.masterVolume, updated.musicVolume, updated.sfxVolume);
  };

  const toggleScreenShake = () => {
    const updated = { ...settings, screenShake: !settings.screenShake };
    setSettings(updated);
    SaveManager.saveSettings(updated);
  };

  const toggleReducedMotion = () => {
    const updated = { ...settings, reducedMotion: !settings.reducedMotion };
    setSettings(updated);
    SaveManager.saveSettings(updated);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 font-garamond">
      <div className="bg-slate-950/95 border-2 border-amber-500/40 rounded-xl p-6 max-w-lg w-full shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-amber-900/40 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="font-cinzel font-bold text-xl text-amber-200 tracking-wider">
              PROTOCOL CONFIGURATION
            </h2>
          </div>
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Volume Controls */}
        <div className="flex flex-col gap-4">
          <span className="text-xs font-cinzel tracking-widest text-amber-400 uppercase flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400" /> HARMONIC SUBSYSTEMS
          </span>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-slate-300 font-cinzel">
              <span>MASTER RESONANCE</span>
              <span>{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-slate-300 font-cinzel">
              <span>SYNTHESIZER HYMN (BGM)</span>
              <span>{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-slate-300 font-cinzel">
              <span>COMBAT IMPACTS (SFX)</span>
              <span>{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Accessibility & Visual FX */}
        <div className="flex flex-col gap-3 border-t border-amber-900/40 pt-4">
          <span className="text-xs font-cinzel tracking-widest text-cyan-400 uppercase flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" /> ACCESSIBILITY & VISUAL AURA
          </span>

          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-200 font-garamond">Screen Quake Effects</span>
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                toggleScreenShake();
              }}
              className={`px-3 py-1 rounded text-xs font-cinzel font-bold tracking-wider transition-colors ${
                settings.screenShake ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.screenShake ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-200 font-garamond">Reduced Motion</span>
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                toggleReducedMotion();
              }}
              className={`px-3 py-1 rounded text-xs font-cinzel font-bold tracking-wider transition-colors ${
                settings.reducedMotion ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.reducedMotion ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-slate-200 font-garamond">Display Mode</span>
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                toggleFullscreen();
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-cinzel tracking-wider transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              FULLSCREEN
            </button>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.currentTarget.blur();
            onClose();
          }}
          className="mt-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-cinzel font-bold tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        >
          CONFIRM & CLOSE
        </button>
      </div>
    </div>
  );
};
