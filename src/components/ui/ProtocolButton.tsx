'use client';

import React from 'react';

export type ProtocolVariant = 'order' | 'entropy' | 'neutral' | 'danger' | 'ghost';
export type ProtocolSize = 'sm' | 'md' | 'lg';

interface ProtocolButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ProtocolVariant;
  size?: ProtocolSize;
  icon?: React.ReactNode;
  /** Right-aligned affordance, e.g. a chevron on the primary action. */
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Every variant is legible BEFORE interaction — solid graphite surfaces and
 * full-strength borders rather than low-alpha tints, because these sit on top
 * of very dark key art. Hover/focus inverts to an icy-white fill with graphite
 * text, which is the strongest contrast step available without changing any
 * box dimension (border width is constant, so nothing reflows).
 */
const VARIANTS: Record<ProtocolVariant, string> = {
  // Primary: dark graphite, crisp cyan edge, white label -> white-out on hover.
  order:
    'bg-graphite text-white border-order-cyan ' +
    'shadow-[0_0_20px_-6px_rgba(0,207,255,0.55)] ' +
    'hover:bg-order-ice hover:text-obsidian hover:border-order-ice ' +
    'hover:shadow-[0_0_0_1px_rgba(0,207,255,0.9),0_0_34px_-4px_rgba(0,207,255,0.8)] ' +
    'focus-visible:bg-order-ice focus-visible:text-obsidian',
  // Entropy-aligned, used sparingly — never as a generic secondary.
  entropy:
    'bg-entropy-dark text-white border-entropy-crimson ' +
    'shadow-[0_0_20px_-6px_rgba(255,36,61,0.5)] ' +
    'hover:bg-entropy-hi hover:text-obsidian hover:border-entropy-hi ' +
    'hover:shadow-[0_0_0_1px_rgba(255,36,61,0.9),0_0_34px_-4px_rgba(255,36,61,0.75)]',
  // Secondary: dark translucent, visible steel edge, white label.
  neutral:
    'bg-graphite/85 text-paper border-steel/60 ' +
    'hover:bg-paper hover:text-obsidian hover:border-paper ' +
    'hover:shadow-[0_0_0_1px_rgba(234,242,247,0.7)]',
  // Destructive only.
  danger:
    'bg-entropy-dark text-entropy-hi border-entropy-red ' +
    'hover:bg-entropy-crimson hover:text-white hover:border-entropy-crimson',
  // Chrome-level actions that must not compete with the primary CTA.
  ghost:
    'bg-black/40 text-paper border-steel/35 ' +
    'hover:bg-paper hover:text-obsidian hover:border-paper',
};

const SIZES: Record<ProtocolSize, string> = {
  sm: 'px-3.5 py-1.5 text-[0.7rem] tracking-[0.18em] gap-1.5',
  md: 'px-5 py-2.5 text-xs tracking-[0.2em] gap-2',
  lg: 'px-8 py-4 text-sm md:text-base tracking-[0.26em] gap-3',
};

/**
 * The single button primitive for the whole interface.
 *
 * Angular notched silhouette, fine technical border, faction-coloured
 * illumination on hover/focus only (never a permanent glow), and a visible
 * focus ring that survives on top of busy key art.
 */
export const ProtocolButton: React.FC<ProtocolButtonProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  trailing,
  children,
  className = '',
  disabled,
  onClick,
  ...rest
}) => {
  // Drop DOM focus after a pointer activation so gameplay keys keep reaching
  // the Phaser canvas instead of re-triggering the button on Space/Enter.
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.detail > 0) e.currentTarget.blur();
    onClick?.(e);
  };

  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={handleClick}
      className={[
        'sweep-host clip-notch focus-protocol',
        'relative inline-flex items-center justify-center',
        'font-ui font-bold uppercase border',
        'transition-all duration-200',
        'active:scale-[0.98]',
        SIZES[size],
        disabled
          ? 'opacity-35 saturate-0 cursor-not-allowed pointer-events-none'
          : VARIANTS[variant],
        className,
      ].join(' ')}
    >
      {!disabled && <span className="sweep" aria-hidden="true" />}
      {icon && <span className="relative shrink-0">{icon}</span>}
      <span className="relative whitespace-nowrap">{children}</span>
      {trailing && <span className="relative shrink-0">{trailing}</span>}
    </button>
  );
};
