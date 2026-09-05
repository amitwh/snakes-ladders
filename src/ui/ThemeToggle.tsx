import { useEffect, useState } from 'react';

const KEY = 'sl-theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem(KEY) === 'light' ? 'light' : 'dark',
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return (
    <button
      className="btn-ghost"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
