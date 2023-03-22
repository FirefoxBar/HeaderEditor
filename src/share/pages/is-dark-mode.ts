import { prefs } from '@/share/core/prefs';

const isDarkMode = () => {
  const darkMode = prefs.get('dark-mode');
  switch (darkMode) {
    case 'auto':
      try {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        return mql.matches;
      } catch (e) {
        // ignore
      }
      break;
    case 'on':
      return true;
    default:
      break;
  }
  return false;
};

export default isDarkMode;
