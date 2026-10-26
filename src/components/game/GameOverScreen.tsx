'use client';

import React from 'react';
import { DEFEAT_STORY } from '../../game/data/story';
import { EndingScreen } from './EndingScreen';

export const GameOverScreen: React.FC = () => (
  <EndingScreen
    outcome="defeat"
    copy={DEFEAT_STORY}
    image="/images/defeat.webp"
    primaryLabel="Retry Realm"
  />
);
