/* My World — mode router
 *
 * Title screen → 简单版 (the walk) or 困难版 (the climb).
 * Each game's "← 标题" button returns here to switch modes.
 */

import { useState } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import WalkGame from './WalkGame.jsx';
import ClimbGame from './ClimbGame.jsx';
import { initAudio, startBgm } from './world/sound.js';

export default function App() {
  const [mode, setMode] = useState('title'); // 'title' | 'simple' | 'hard'

  // Picking a mode is a user gesture — the only moment we're allowed to
  // start audio. Kick off the AudioContext and the background ambience here.
  const pick = (m) => {
    initAudio();
    startBgm();
    setMode(m);
  };

  if (mode === 'simple') return <WalkGame onExit={() => setMode('title')} />;
  if (mode === 'hard')   return <ClimbGame onExit={() => setMode('title')} />;
  return <TitleScreen onPick={pick} />;
}
