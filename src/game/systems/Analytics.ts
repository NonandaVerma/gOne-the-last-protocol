import { track } from '@vercel/analytics';

/**
 * Thin wrapper around Vercel's custom-event tracking.
 *
 * Gameplay milestones (not page views — those are handled by the <Analytics />
 * component in layout.tsx) so a LinkedIn-driven visit can be distinguished
 * from someone who actually pressed play. Every call is fire-and-forget and
 * swallows its own errors: analytics must never affect gameplay, and must
 * never throw during SSR or when the script is blocked (ad-blockers, privacy
 * browsers) — in both cases `track` either doesn't exist yet or no-ops.
 */
function safeTrack(event: string, data?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  try {
    track(event, data);
  } catch {
    /* analytics unavailable — never break gameplay over this */
  }
}

/** Fires once per browser session — distinguishes "actually played" from a repeat level_started on stage retry/resume. */
let gameplayStartedFired = false;

export const Analytics = {
  gameLoaded: () => safeTrack('game_loaded'),
  gameStartClicked: (level: number) => safeTrack('game_start_clicked', { level }),
  gameplayStarted: () => {
    if (gameplayStartedFired) return;
    gameplayStartedFired = true;
    safeTrack('gameplay_started');
  },
  levelStarted: (level: number) => safeTrack('level_started', { level }),
  cinematicStarted: (id: string) => safeTrack('cinematic_started', { id }),
  cinematicCompleted: (id: string) => safeTrack('cinematic_completed', { id }),
  cinematicSkipped: (id: string) => safeTrack('cinematic_skipped', { id }),
  levelCompleted: (level: number) => safeTrack('level_completed', { level }),
  playerDefeated: (level: number) => safeTrack('player_defeated', { level }),
};
