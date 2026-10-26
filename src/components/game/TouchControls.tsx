'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Flame, Shield, Sparkles, Wind, Zap } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';

/**
 * Virtual controls for touch devices.
 *
 * Every pad is Order-cyan: these are G-One's own systems, so they share one
 * faction colour and differentiate by size and weight rather than by hue.
 */
const PAD_BASE =
  'clip-notch border border-order-cyan/45 bg-graphite/80 backdrop-blur-sm ' +
  'flex items-center justify-center text-order-cyan ' +
  'active:bg-order-cyan active:text-obsidian active:border-order-ice ' +
  'transition-colors duration-75 touch-none select-none';

interface PadProps {
  onPress: () => void;
  onRelease?: () => void;
  label: string;
  size: string;
  children: React.ReactNode;
  primary?: boolean;
}

const Pad: React.FC<PadProps> = ({ onPress, onRelease, label, size, children, primary }) => (
  <button
    aria-label={label}
    title={label}
    onPointerDown={(e) => {
      e.preventDefault();
      onPress();
    }}
    onPointerUp={onRelease}
    onPointerLeave={onRelease}
    onPointerCancel={onRelease}
    className={[
      PAD_BASE,
      size,
      primary
        ? 'bg-order-deep/90 border-order-cyan text-order-ice shadow-[0_0_20px_-4px_rgba(0,207,255,0.8)]'
        : '',
    ].join(' ')}
  >
    {children}
  </button>
);

export const TouchControls: React.FC = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isTouchDevice) return null;

  const stopMove = () => EventBus.emit(GAME_EVENTS.TRIGGER_STOP_MOVE);

  return (
    <div className="absolute inset-0 pointer-events-none flex justify-between items-end p-4 pb-6 z-30 select-none">
      {/* ---- Left hand: traversal ---- */}
      <div className="flex items-end gap-2 pointer-events-auto">
        <Pad
          label="Move left"
          size="w-14 h-14"
          onPress={() => EventBus.emit(GAME_EVENTS.TRIGGER_MOVE_LEFT)}
          onRelease={stopMove}
        >
          <ArrowLeft className="w-6 h-6" />
        </Pad>

        <Pad
          label="Move right"
          size="w-14 h-14"
          onPress={() => EventBus.emit(GAME_EVENTS.TRIGGER_MOVE_RIGHT)}
          onRelease={stopMove}
        >
          <ArrowRight className="w-6 h-6" />
        </Pad>

        <Pad
          label="Jump"
          size="w-14 h-14 ml-2"
          onPress={() => EventBus.emit(GAME_EVENTS.TRIGGER_JUMP)}
        >
          <ArrowUp className="w-6 h-6" />
        </Pad>
      </div>

      {/* ---- Right hand: combat ---- */}
      <div className="flex flex-col gap-2 items-end pointer-events-auto">
        <div className="flex gap-2">
          <Pad
            label="Overdrive"
            size="w-12 h-12"
            onPress={() => EventBus.emit(GAME_EVENTS.TRIGGER_OVERDRIVE)}
          >
            <Flame className="w-5 h-5" />
          </Pad>

          <Pad
            label="Phase dash"
            size="w-12 h-12"
            onPress={() => EventBus.emit(GAME_EVENTS.TRIGGER_DASH)}
          >
            <Wind className="w-5 h-5" />
          </Pad>

          <Pad
            label="Arc burst"
            size="w-12 h-12"
            onPress={() => EventBus.emit(GAME_EVENTS.TRIGGER_ARC)}
          >
            <Sparkles className="w-5 h-5" />
          </Pad>
        </div>

        <div className="flex gap-2">
          <Pad
            label="Aegis shield"
            size="w-14 h-14"
            onPress={() => EventBus.emit(GAME_EVENTS.TRIGGER_SHIELD)}
          >
            <Shield className="w-6 h-6" />
          </Pad>

          <Pad
            label="Pulse shot"
            size="w-16 h-16"
            primary
            onPress={() => EventBus.emit(GAME_EVENTS.TRIGGER_SHOOT)}
          >
            <Zap className="w-7 h-7 fill-current" />
          </Pad>
        </div>
      </div>
    </div>
  );
};
