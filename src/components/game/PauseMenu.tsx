'use client';

import React from 'react';
import { BookOpen, Home, Play, RotateCcw, Settings } from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/systems/EventBus';
import { ModalShell } from '../ui/ModalShell';
import { ProtocolButton } from '../ui/ProtocolButton';

interface PauseMenuProps {
  onResume: () => void;
  onOpenSettings: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onOpenSettings }) => (
  // Escape resumes rather than silently closing into a frozen game.
  <ModalShell
    title="Protocol Suspended"
    subtitle="Combat paused // state preserved"
    faction="order"
    width="max-w-sm"
    onClose={onResume}
  >
    <div className="flex flex-col gap-2.5">
      <ProtocolButton
        variant="order"
        size="md"
        onClick={onResume}
        icon={<Play className="w-4 h-4 fill-current" />}
        className="w-full"
      >
        Resume
      </ProtocolButton>

      <ProtocolButton
        variant="neutral"
        size="md"
        onClick={() => EventBus.emit(GAME_EVENTS.RESTART_LEVEL)}
        icon={<RotateCcw className="w-4 h-4" />}
        className="w-full"
      >
        Restart Realm
      </ProtocolButton>

      <ProtocolButton
        variant="neutral"
        size="md"
        onClick={() => EventBus.emit(GAME_EVENTS.RESTART_STORY)}
        icon={<BookOpen className="w-4 h-4" />}
        className="w-full"
      >
        Restart Campaign
      </ProtocolButton>

      <ProtocolButton
        variant="neutral"
        size="md"
        onClick={onOpenSettings}
        icon={<Settings className="w-4 h-4" />}
        className="w-full"
      >
        Settings
      </ProtocolButton>

      {/* Leaving the run is the one destructive action here. */}
      <ProtocolButton
        variant="danger"
        size="md"
        onClick={() => EventBus.emit(GAME_EVENTS.QUIT_TO_MENU)}
        icon={<Home className="w-4 h-4" />}
        className="w-full mt-2"
      >
        Abandon Run
      </ProtocolButton>
    </div>
  </ModalShell>
);
