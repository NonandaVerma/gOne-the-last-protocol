'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { ProtocolButton } from './ProtocolButton';
import { SeamDivider, SeamSigil } from './Seam';

type ModalFaction = 'order' | 'entropy' | 'neutral';

interface ModalShellProps {
  title: string;
  /** Small uppercase line under the title, e.g. a system status. */
  subtitle?: string;
  onClose: () => void;
  faction?: ModalFaction;
  /** Tailwind max-width class for the panel. */
  width?: string;
  /** Pinned action row at the bottom of the panel. */
  footer?: React.ReactNode;
  /** Set false for dialogs that must be dismissed deliberately. */
  dismissOnBackdrop?: boolean;
  children: React.ReactNode;
}

const EDGE: Record<ModalFaction, string> = {
  order: 'panel-order',
  entropy: 'panel-entropy',
  neutral: '',
};

const TITLE_TINT: Record<ModalFaction, string> = {
  order: 'text-order-ice',
  entropy: 'text-entropy-hi',
  neutral: 'text-paper',
};

/**
 * The single dialog primitive — every modal in the game uses it so backdrop
 * behaviour, Escape handling, focus management and the header lockup stay
 * identical across Pause, Settings, the field manual and confirmations.
 */
export const ModalShell: React.FC<ModalShellProps> = ({
  title,
  subtitle,
  onClose,
  faction = 'neutral',
  width = 'max-w-lg',
  footer,
  dismissOnBackdrop = true,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Remember what had focus so we can hand it back on close.
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();

    // Capture-phase so the dialog consumes Escape before gameplay handlers.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);

    return () => {
      window.removeEventListener('keydown', onKey, true);
      restoreFocusRef.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={dismissOnBackdrop ? onClose : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/92 backdrop-blur-xl animate-fade-in"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`panel ${EDGE[faction]} w-full ${width} max-h-[90vh] flex flex-col outline-none animate-rise-in`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <SeamSigil size={15} />
            <div className="min-w-0">
              <h2
                className={`font-display font-bold text-sm tracking-[0.2em] uppercase truncate ${TITLE_TINT[faction]}`}
              >
                {title}
              </h2>
              {subtitle && (
                <p className="hud-label text-muted/70 mt-1 text-[0.58rem]">{subtitle}</p>
              )}
            </div>
          </div>

          <ProtocolButton
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label={`Close ${title}`}
            icon={<X className="w-4 h-4" />}
          >
            <span className="sr-only">Close</span>
          </ProtocolButton>
        </div>

        <SeamDivider />

        {/* Body */}
        <div className="scroll-protocol overflow-y-auto p-5">{children}</div>

        {footer && <div className="p-5 pt-0">{footer}</div>}
      </div>
    </div>
  );
};
