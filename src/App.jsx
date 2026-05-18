/* My World — mode router
 *
 * Title screen → 简单版 (the walk) or 困难版 (the climb).
 * Each game's "← 标题" button returns here to switch modes.
 */

import { useState } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import WalkGame from './WalkGame.jsx';
import ClimbGame from './ClimbGame.jsx';

export default function App() {
  const [mode, setMode] = useState('title'); // 'title' | 'simple' | 'hard'

  if (mode === 'simple') return <WalkGame onExit={() => setMode('title')} />;
  if (mode === 'hard')   return <ClimbGame onExit={() => setMode('title')} />;
  return <TitleScreen onPick={setMode} />;
}
