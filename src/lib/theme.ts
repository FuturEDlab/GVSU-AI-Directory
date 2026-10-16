export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'gvsu_theme_v2';

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('theme');
  } catch {}
  const isDark = theme === 'dark';

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('theme');
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    localStorage.removeItem('theme');
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'light';
  } catch {
    return 'light';
  }
}
