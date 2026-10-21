'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface IntroCinematicProps {
  /** Called exactly once, on skip, natural end, or unrecoverable error. */
  onFinish: () => void;
}

/**
 * NARRATIVE CUES.
 *
 * Positions are FRACTIONS of the video's real duration, read from
 * `video.duration` at runtime rather than hardcoded seconds — the footage can
 * be re-cut without the subtitles drifting out of the clip.
 *
 * They are spread evenly across the timeline as a principled default. Aligning
 * each line to its exact visual beat (G-One's reveal, Ra-One's reveal, the
 * seam widening) needs a pass with eyes on the footage; adjust `from`/`to`
 * here and nothing else needs to change.
 */
interface Cue {
  from: number;
  to: number;
  text: string;
  /** Rendered as the closing title lockup rather than a subtitle. */
  title?: boolean;
}

const CUES: Cue[] = [
  { from: 0.02, to: 0.16, text: 'Before the worlds were divided, reality existed in perfect balance.' },
  { from: 0.18, to: 0.32, text: 'From the light of Order, a guardian was forged.' },
  { from: 0.34, to: 0.48, text: 'But beyond the fracture, Entropy awakened.' },
  { from: 0.5, to: 0.62, text: 'Two forces. One collapsing universe.' },
  { from: 0.64, to: 0.76, text: 'As the Protocol fails, every realm begins to fall.' },
  { from: 0.78, to: 0.9, text: 'Only one force can determine what survives.' },
  { from: 0.92, to: 1.0, text: 'G-ONE: THE LAST PROTOCOL', title: true },
];

type Phase = 'loading' | 'needs-gesture' | 'playing' | 'error';

export const IntroCinematic: React.FC<IntroCinematicProps> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [muted, setMuted] = useState(false);
  const [cue, setCue] = useState<Cue | null>(null);
  /** Guards against double-firing from overlapping skip inputs. */
  const finishedRef = useRef(false);

  /** Stop playback, release the stream, then hand control to the landing page. */
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        // Detach the source so no cinematic audio survives behind the menu.
        v.removeAttribute('src');
        v.load();
      } catch {
        /* element already torn down */
      }
    }
    onFinish();
  }, [onFinish]);

  /* ---- Autoplay WITH SOUND, falling back to an explicit gesture ---- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = false;
    v.volume = 1;

    v.play()
      .then(() => {
        setPhase('playing');
        setMuted(false);
      })
      .catch((err: unknown) => {
        // Browsers block audible autoplay until the user has interacted.
        // We never silently fall back to muted — the cinematic is meant to
        // be heard, so we ask for one click instead.
        const name = (err as { name?: string })?.name;
        if (name === 'NotAllowedError' || name === 'AbortError') {
          setPhase('needs-gesture');
        } else {
          setPhase('error');
        }
      });
  }, []);

  /* ---- Skip on Space; never let it scroll the page ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Escape') return;
      // While waiting for a gesture, Space should START the cinematic with
      // sound rather than skip past the thing the user came to see.
      if (phase === 'needs-gesture') return;
      e.preventDefault();
      e.stopPropagation();
      finish();
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [finish, phase]);

  /** Start playback from inside the user's gesture, with sound. */
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
      setPhase('error');
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  /** Drive subtitles from the real timeline. */
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration || !Number.isFinite(v.duration)) return;
    const t = v.currentTime / v.duration;
    const active = CUES.find((c) => t >= c.from && t < c.to) ?? null;
    setCue((prev) => (prev?.text === active?.text ? prev : active));
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-obsidian flex items-center justify-center"
      onClick={phase === 'playing' ? finish : undefined}
      role="dialog"
      aria-label="Opening cinematic"
    >
      {/* `contain` preserves the composition — both characters and the logo
          stay fully in frame on every aspect ratio, at the cost of letterbox
          bars that read as cinematic rather than as a layout bug. */}
      <video
        ref={videoRef}
        src="/images/video_intro.mp4"
        className="absolute inset-0 w-full h-full object-contain bg-obsidian"
        playsInline
        preload="auto"
        onEnded={finish}
        onTimeUpdate={onTimeUpdate}
        onError={() => setPhase('error')}
      />

      {/* Gentle floor gradient purely for subtitle legibility. */}
      {phase === 'playing' && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* ---------------- Subtitles ---------------- */}
      {phase === 'playing' && (
        <div className="absolute inset-x-0 bottom-[9%] px-6 flex justify-center pointer-events-none">
          <p
            key={cue?.text ?? 'none'}
            aria-live="polite"
            className={[
              'max-w-3xl text-center transition-opacity duration-700',
              cue ? 'opacity-100' : 'opacity-0',
              cue?.title
                ? 'font-display font-black text-2xl md:text-4xl tracking-[0.14em] text-white'
                : 'font-ui font-medium text-lg md:text-2xl tracking-wide text-white',
            ].join(' ')}
            style={{ textShadow: '0 2px 14px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,1)' }}
          >
            {cue?.text ?? ''}
          </p>
        </div>
      )}

      {/* ---------------- Controls ---------------- */}
      {phase === 'playing' && (
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label={muted ? 'Unmute cinematic' : 'Mute cinematic'}
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
            [ Space / Click to Skip ]
          </button>
        </div>
      )}

      {/* ---------------- Audible-autoplay blocked ---------------- */}
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
            Play Cinematic — Sound On
          </button>
          <button
            onClick={finish}
            className="focus-protocol font-ui text-[0.68rem] uppercase tracking-[0.2em] text-muted hover:text-paper transition-colors"
          >
            Skip to menu
          </button>
        </div>
      )}

      {/* ---------------- Unrecoverable playback failure ---------------- */}
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
    </div>
  );
};
