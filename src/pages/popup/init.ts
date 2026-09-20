import browser from 'webextension-polyfill';
import { prefs } from '@/share/core/prefs';

function withRAF(callback: () => void) {
  let waiting = false;
  return () => {
    if (waiting) {
      return;
    }
    waiting = true;
    requestAnimationFrame(() => {
      try {
        callback();
      } catch (e) {
        console.error(e);
      }
      waiting = false;
    });
  };
}

function handleStyleVar() {
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);

  const updateStyle = withRAF(() => {
    const styles = [];
    const height = prefs.get('popup-height');
    const width = prefs.get('popup-width');
    if (height) {
      styles.push(`height:${height}px`);
    }
    if (width) {
      styles.push(`width:${width}px`);
    }
    styleEl.innerHTML = `body{${styles.length === 0 ? '' : styles.join(';')}}`;
  });

  prefs.watchKey('popup-height', updateStyle);
  prefs.watchKey('popup-width', updateStyle);
  prefs.ready(updateStyle);
}

handleStyleVar();

if (typeof window !== 'undefined' && typeof window.browser === 'undefined') {
  window.browser = browser;
}
