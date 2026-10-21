'use client';

import React, { useEffect, useState } from 'react';
import { Eye, Maximize2, Minimize2, Volume2 } from 'lucide-react';
import { GameSettings } from '../../game/types/game';
import { SaveManager } from '../../game/systems/SaveManager';
import { AudioManager } from '../../game/systems/AudioManager';
import { ModalShell } from '../ui/ModalShell';
import { ProtocolButton } from '../ui/ProtocolButton';

interface SettingsMenuProps {
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* Technical slider — cyan fill, notched thumb, live numeric readout.  */
/* ------------------------------------------------------------------ */
const VolumeSlider: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => {
  const pct = Math.round(value * 100);
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <span className="hud-label text-[0.58rem] text-steel">{label}</span>
        <span className="font-ui text-[0.66rem] font-bold tabular-nums text-order-cyan">
          {pct}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        className="w-full h-1 appearance-none cursor-pointer bg-obsidian border border-steel/20 accent-order-cyan focus-protocol"
        style={{
          background: `linear-gradient(to right, #00CFFF 0%, #00CFFF ${pct}%, #070A0F ${pct}%, #070A0F 100%)`,
        }}
      />
    </label>
  );
};

/* ------------------------------------------------------------------ */
/* Binary toggle — reads as a hardware switch, not a rounded pill.     */
/* ------------------------------------------------------------------ */
const Toggle: React.FC<{
  label: string;
  hint?: string;
  enabled: boolean;
  onToggle: () => void;
}> = ({ label, hint, enabled, onToggle }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="min-w-0">
      <span className="font-ui text-xs font-semibold text-paper block">{label}</span>
      {hint && <span className="font-body text-[0.66rem] text-muted/70">{hint}</span>}
    </div>
    <button
      onClick={(e) => {
        e.currentTarget.blur();
        onToggle();
      }}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={[
        'clip-notch border px-3 py-1 shrink-0 transition-all focus-protocol',
        'font-ui text-[0.6rem] font-bold uppercase tracking-[0.16em]',
        enabled
          ? 'border-order-cyan/70 bg-order-deep text-order-cyan shadow-[0_0_14px_-3px_rgba(0,207,255,0.8)]'
          : 'border-steel/25 bg-graphite text-muted/60',
      ].join(' ')}
    >
      {enabled ? 'On' : 'Off'}
    </button>
  </div>
);

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<GameSettings>(SaveManager.getSettings());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsFullscreen(Boolean(document.fullscreenElement));
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  /** Persist, then push the new mix straight into the live audio engine. */
  const apply = (patch: Partial<GameSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    SaveManager.saveSettings(updated);
    AudioManager.getInstance().setVolumes(
      updated.masterVolume,
      updated.musicVolume,
      updated.sfxVolume
    );
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* Browser refused — leave the reported state alone. */
    }
  };

  return (
    <ModalShell
      title="Configuration"
      subtitle="Audio // Accessibility // Display"
      faction="order"
      width="max-w-lg"
      onClose={onClose}
      footer={
        <ProtocolButton variant="order" size="md" onClick={onClose} className="w-full">
          Close
        </ProtocolButton>
      }
    >
      <div className="flex flex-col gap-5">
        {/* ---- Audio ---- */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-order-cyan" />
            <span className="hud-label text-order-ice">Audio</span>
          </div>
          <VolumeSlider
            label="Master"
            value={settings.masterVolume}
            onChange={(v) => apply({ masterVolume: v })}
          />
          <VolumeSlider
            label="Music"
            value={settings.musicVolume}
            onChange={(v) => apply({ musicVolume: v })}
          />
          <VolumeSlider
            label="Effects"
            value={settings.sfxVolume}
            onChange={(v) => apply({ sfxVolume: v })}
          />
        </section>

        <div className="seam-divider" aria-hidden="true" />

        {/* ---- Accessibility & display ---- */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-order-cyan" />
            <span className="hud-label text-order-ice">Accessibility &amp; Display</span>
          </div>

          <Toggle
            label="Screen Shake"
            hint="Impact feedback on hits and explosions"
            enabled={settings.screenShake}
            onToggle={() => apply({ screenShake: !settings.screenShake })}
          />
          <Toggle
            label="Reduced Motion"
            hint="Suppresses ambient and decorative animation"
            enabled={settings.reducedMotion}
            onToggle={() => apply({ reducedMotion: !settings.reducedMotion })}
          />

          <div className="flex items-center justify-between gap-4 py-1">
            <div className="min-w-0">
              <span className="font-ui text-xs font-semibold text-paper block">Display Mode</span>
              <span className="font-body text-[0.66rem] text-muted/70">
                {isFullscreen ? 'Currently fullscreen' : 'Currently windowed'}
              </span>
            </div>
            <ProtocolButton
              size="sm"
              variant="neutral"
              onClick={toggleFullscreen}
              icon={
                isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />
              }
            >
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </ProtocolButton>
          </div>
        </section>
      </div>
    </ModalShell>
  );
};
