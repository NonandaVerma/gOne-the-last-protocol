'use client';

import React, { useState } from 'react';
import { Crosshair, Shield, Wind, Zap } from 'lucide-react';
import { RELIC_DEFINITIONS } from '../../game/data/relics';
import { RelicType } from '../../game/types/game';
import { ModalShell } from '../ui/ModalShell';
import { ProtocolButton } from '../ui/ProtocolButton';

interface HowToPlayModalProps {
  onClose: () => void;
}

const CONTROL_GROUPS = [
  {
    icon: Wind,
    title: 'Movement',
    rows: [
      ['A / D · ← →', 'Traverse'],
      ['W / Space / ↑', 'Jump'],
      ['Shift', 'Phase Dash — invulnerable'],
    ],
  },
  {
    icon: Zap,
    title: 'Offense',
    rows: [
      ['LMB / J', 'Pulse Shot — aims at cursor'],
      ['L', 'Arc Burst — piercing wave'],
      ['E', 'Final Overdrive — at 100%'],
    ],
  },
  {
    icon: Shield,
    title: 'Defense',
    rows: [
      ['RMB / K', 'Aegis Barrier'],
      ['Esc', 'Pause'],
    ],
  },
  {
    icon: Crosshair,
    title: 'Aiming',
    rows: [
      ['Mouse', 'Free crosshair targeting'],
      ['Touch', 'On-screen controls auto-enable'],
    ],
  },
] as const;

/** Crimson-tinted fragments are the corrupted, risk/reward kind. */
const isCorrupted = (color: number) => color === 0xff243d;

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'controls' | 'relics'>('controls');

  const relics = Object.values(RELIC_DEFINITIONS) as Array<
    (typeof RELIC_DEFINITIONS)[RelicType]
  >;

  return (
    <ModalShell
      title="Field Manual"
      subtitle="Controls // Fragments"
      faction="order"
      width="max-w-3xl"
      onClose={onClose}
      footer={
        <ProtocolButton variant="order" size="md" onClick={onClose} className="w-full">
          Acknowledge
        </ProtocolButton>
      }
    >
      <div className="flex gap-2 mb-4" role="tablist">
        <ProtocolButton
          role="tab"
          aria-selected={tab === 'controls'}
          size="sm"
          variant={tab === 'controls' ? 'order' : 'ghost'}
          onClick={() => setTab('controls')}
        >
          Controls
        </ProtocolButton>
        <ProtocolButton
          role="tab"
          aria-selected={tab === 'relics'}
          size="sm"
          variant={tab === 'relics' ? 'order' : 'ghost'}
          onClick={() => setTab('relics')}
        >
          Fragments
        </ProtocolButton>
      </div>

      {tab === 'controls' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONTROL_GROUPS.map(({ icon: Icon, title, rows }) => (
            <div key={title} className="bg-graphite/70 border border-steel/15 p-4 clip-notch">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-order-cyan" />
                <span className="hud-label text-order-ice">{title}</span>
              </div>
              <dl className="flex flex-col gap-2">
                {rows.map(([key, action]) => (
                  <div key={key} className="flex items-baseline justify-between gap-3">
                    <dt className="font-ui text-xs font-semibold text-steel whitespace-nowrap">
                      {key}
                    </dt>
                    <dd className="font-body text-[0.72rem] text-muted text-right">{action}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {relics.map((relic) => {
            const corrupted = isCorrupted(relic.color);
            return (
              <div
                key={relic.id}
                className={[
                  'p-3.5 clip-notch border bg-graphite/70',
                  corrupted
                    ? 'border-entropy-crimson/40 shadow-[inset_2px_0_0_0_rgba(255,36,61,0.6)]'
                    : 'border-order-cyan/25 shadow-[inset_2px_0_0_0_rgba(0,207,255,0.45)]',
                ].join(' ')}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span
                    className={`font-display font-bold text-xs tracking-wide ${
                      corrupted ? 'text-entropy-hi' : 'text-order-ice'
                    }`}
                  >
                    {relic.name}
                  </span>
                  <span className="hud-label text-[0.56rem] text-muted/70">{relic.tagline}</span>
                </div>
                <p className="font-body text-[0.72rem] leading-relaxed text-muted">
                  {relic.description}
                </p>
                {!!relic.duration && relic.duration > 0 && (
                  <span className="mt-2 inline-block hud-label text-[0.56rem] text-steel/70">
                    {relic.duration / 1000}s duration
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stakes callout — the one place crimson is used as a warning */}
      <div className="mt-4 p-3.5 clip-notch bg-entropy-dark/60 border border-entropy-crimson/35 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="hud-label text-entropy-crimson">Decisive Stakes</span>
        <span className="font-body text-[0.72rem] text-muted">
          The final realm is a sudden-death duel — a single hit decides the world.
        </span>
      </div>
    </ModalShell>
  );
};
