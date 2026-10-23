'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, SkipForward, Volume2, VolumeX } from 'lucide-react';

import {
  REALM_REVEALS,
  getRealmReveal,
  type RealmRevealConfig as RealmReveal,
  type RevealCue as Cue,
} from '../../game/data/story';

export { getRealmReveal, REALM_REVEALS, type RealmReveal, type Cue };

interface LevelRevealCinematicProps {
  level: number;
  /** Called exactly once, on skip, natural end, or unrecoverable error. */
  onFinish: () => void;
}

type Phase = 'loading' | 'needs-gesture' | 'playing' | 'error';

/**
 * Full-screen narrative reveal shown before a realm's gameplay begins.
 *
 * Shares its audible-autoplay-first / explicit-gesture-fallback contract with
 * `IntroCinematic` (the app-open cinematic): never silently falls back to
 * muted playback, and skip is idempotent against overlapping inputs.
 */
export const LevelRevealCinematic: React.FC<LevelRevealCinematicProps> = ({ level, onFinish }) => {
  const reveal = REALM_REVEALS[level];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [muted, setMuted] = useState(false);
  const [cue, setCue] = useState<Cue | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsFadingOut(true);

    // Give 420ms for smooth cinematic fade-to-black before unmounting
    window.setTimeout(() => {
      const v = videoRef.current;
      if (v) {
        try {
          v.pause();
        } catch {
          /* element already torn down */
        }
      }
      onFinish();
    }, 420);
  }, [onFinish]);

  // No footage configured for this realm — resolve immediately. Declared as
  // a normal effect (not inside a conditional) so hook order stays stable.
  useEffect(() => {
    if (!reveal) onFinish();
  }, [reveal, onFinish]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !reveal) return;

    v.muted = false;
    v.volume = 1;

    v.play()
      .then(() => {
        setPhase('playing');
        setMuted(false);
      })
      .catch((err: unknown) => {
        const name = (err as { name?: string })?.name;
        if (name === 'NotAllowedError' || name === 'AbortError') {
          // If audible autoplay is blocked by browser policy, play muted immediately so footage and subtitles roll
          v.muted = true;
          v.play()
            .then(() => {
              setPhase('playing');
              setMuted(true);
            })
            .catch(() => {
              setPhase('needs-gesture');
            });
        } else {
          setPhase('error');
        }
      });
  }, [reveal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Enter' && e.key !== 'Escape') return;
      if (phase === 'needs-gesture') return;
      e.preventDefault();
      e.stopPropagation();
      finish();
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [finish, phase]);

  const startWithSound = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = false;
      v.volume = 1;
      await v.play();
      setMuted(false);
      setPhase('playing');
    } catch {
      try {
        v.muted = true;
        await v.play();
        setMuted(true);
        setPhase('playing');
      } catch {
        setPhase('error');
      }
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration || !Number.isFinite(v.duration) || !reveal?.cues) return;
    const t = v.currentTime / v.duration;
    const active = reveal.cues.find((c) => t >= c.from && t < c.to) ?? null;
    setCue((prev) => (prev?.text === active?.text ? prev : active));
  };

  // No footage configured for this realm yet — never render, caller should
  // not have mounted us; the effect above already resolved onFinish.
  if (!reveal) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-obsidian flex items-center justify-center overflow-hidden"
      onClick={phase === 'playing' ? finish : undefined}
      role="dialog"
      aria-label={`Realm ${level} reveal`}
    >
      <video
        ref={videoRef}
        src={reveal.video}
        className="absolute inset-0 w-full h-full object-cover bg-obsidian"
        playsInline
        preload="auto"
        onEnded={finish}
        onTimeUpdate={onTimeUpdate}
        onError={() => setPhase('error')}
      />

      {phase === 'playing' && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none z-10"
          aria-hidden="true"
        />
      )}

      {phase === 'playing' && (
        <div className="absolute inset-x-0 bottom-[9%] px-6 flex justify-center pointer-events-none z-20">
          <p
            key={cue?.text ?? 'none'}
            aria-live="polite"
            className={[
              'max-w-3xl text-center font-ui font-medium text-lg md:text-2xl tracking-wide text-white transition-opacity duration-700',
              cue ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            style={{ textShadow: '0 2px 14px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,1)' }}
          >
            {cue?.text ?? ''}
          </p>
        </div>
      )}

      {phase === 'playing' && (
        <div className="absolute top-5 right-5 flex items-center gap-2 z-30">
          <button
            onClick={toggleSound}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="focus-protocol p-2 border border-order-cyan/40 bg-black/50 text-order-ice hover:bg-black/75 hover:border-order-cyan transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              finish();
            }}
            className="focus-protocol flex items-center gap-2 px-3.5 py-2 border border-order-cyan/40 bg-black/50 text-order-ice hover:bg-black/75 hover:border-order-cyan transition-colors font-ui text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
          >
            <SkipForward className="w-3.5 h-3.5" />
            [ Space / Enter / Click to Skip ]
          </button>
        </div>
      )}

      {phase === 'needs-gesture' && (
        <div className="absolute inset-0 bg-obsidian/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="font-ui uppercase tracking-[0.26em] text-[0.7rem] text-muted">
            This cinematic is meant to be heard
          </p>
          <button
            onClick={startWithSound}
            autoFocus
            className="focus-protocol group flex items-center gap-3 px-8 py-4 border border-order-cyan bg-graphite text-white hover:bg-order-ice hover:text-obsidian transition-colors duration-200 font-display font-bold text-sm md:text-base tracking-[0.2em] uppercase"
          >
            <Play className="w-5 h-5 fill-current" />
            Play — Sound On
          </button>
          <button
            onClick={finish}
            className="focus-protocol font-ui text-[0.68rem] uppercase tracking-[0.2em] text-muted hover:text-paper transition-colors"
          >
            Skip to gameplay
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="absolute inset-0 bg-obsidian flex flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="font-ui uppercase tracking-[0.22em] text-[0.7rem] text-muted">
            Cinematic unavailable
          </p>
          <button
            onClick={finish}
            autoFocus
            className="focus-protocol px-8 py-4 border border-order-cyan bg-graphite text-white hover:bg-order-ice hover:text-obsidian transition-colors duration-200 font-display font-bold text-sm tracking-[0.2em] uppercase"
          >
            Continue
          </button>
        </div>
      )}

      {/* Smooth cinematic black dissolve to prevent blank canvas or white flash */}
      <div
        className={`absolute inset-0 bg-obsidian pointer-events-none z-50 transition-opacity duration-400 ${
          isFadingOut ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
    </div>
  );
};
