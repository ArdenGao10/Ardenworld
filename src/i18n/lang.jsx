/* My World — language context.
 *
 * Holds the current language ('zh' | 'en'), a setter that persists the choice,
 * and a `t(key)` helper that resolves a string from strings.js. First load
 * follows: saved choice → browser language → Chinese.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { STRINGS } from './strings.js';

const STORAGE_KEY = 'mw-lang';

function detectInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch { /* ignore */ }
  // Default to Chinese (the game is Chinese-first); only switch on a saved choice.
  return 'zh';
}

const LangContext = createContext({ lang: 'zh', setLang: () => {}, t: (k) => k });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detectInitial);

  const setLang = useCallback((next) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const t = useCallback((key) => {
    const entry = STRINGS[key];
    if (!entry) return key;            // missing key → show the key so it's obvious
    return entry[lang] ?? entry.zh ?? key;
  }, [lang]);

  // Resolve a bilingual value from data.js. Accepts a { zh, en } object
  // (picks the current language) or a plain string / anything else
  // (returned untouched, so untranslated data still works).
  const pick = useCallback((val) => {
    if (val && typeof val === 'object' && !Array.isArray(val) && ('zh' in val || 'en' in val)) {
      return val[lang] ?? val.zh ?? val.en;
    }
    return val;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, pick }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
