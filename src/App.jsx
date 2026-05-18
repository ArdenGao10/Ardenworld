/* My World — mode router
 *
 * Title screen → 简单版 (the walk) or 困难版 (the climb).
 * Each game's "← 标题" button returns here to switch modes.
 */

import { useState } from 'react';
import WalkGame from './WalkGame.jsx';
import ClimbGame from './ClimbGame.jsx';

export default function App() {
  // No title screen — the game opens straight into the walk.
  // Each mode has an on-screen button to switch to the other.
  const [mode, setMode] = useState('simple'); // 'simple' | 'hard'

  if (mode === 'hard') return <ClimbGame onSwitch={() => setMode('simple')} />;
  return <WalkGame onSwitch={() => setMode('hard')} />;
}
