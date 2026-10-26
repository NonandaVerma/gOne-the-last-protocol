'use client';

import React from 'react';
import { VICTORY_STORY } from '../../game/data/story';
import { EndingScreen } from './EndingScreen';

export const VictoryScreen: React.FC = () => (
  <EndingScreen
    outcome="victory"
    copy={VICTORY_STORY}
    primaryLabel="Play Again"
  />
);
