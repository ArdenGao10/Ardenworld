/* My World — mode router
 *
 * Two modes: 散步 (the walk) and 房间 (the room).
 * Climbing now lives inside the room — the standalone climb game is gone.
 */

import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import WalkGame from './WalkGame.jsx';
import RoomGame from './RoomGame.jsx';
import { LangProvider } from './i18n/lang.jsx';

export default function App() {
  const [mode, setMode] = useState('simple'); // 'simple' | 'room'

  // Global hotkey: press `R` to toggle between walk ↔ room.
  // Skipped while focused in an input or while typing in the doodle wall.
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'r' || e.key === 'R') {
        setMode(m => (m === 'room' ? 'simple' : 'room'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <LangProvider>
      {mode === 'room'
        ? <RoomGame onSwitch={() => setMode('simple')} />
        : <WalkGame onRoom={() => setMode('room')} />}
      <Analytics mode="production"/>
    </LangProvider>
  );
}
