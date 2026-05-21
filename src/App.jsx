/* My World — mode router
 *
 * Title screen → 简单版 (the walk) or 困难版 (the climb).
 * Each game's "← 标题" button returns here to switch modes.
 */

import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import WalkGame from './WalkGame.jsx';
import ClimbGame from './ClimbGame.jsx';

export default function App() {
  // No title screen — the game opens straight into the walk.
  // Each mode has an on-screen button to switch to the other.
  const [mode, setMode] = useState('simple'); // 'simple' | 'hard'

  return (
    <>
      {mode === 'hard'
        ? <ClimbGame onSwitch={() => setMode('simple')} />
        : <WalkGame onSwitch={() => setMode('hard')} />}
      <Analytics/>
    </>
  );
}
