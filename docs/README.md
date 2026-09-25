# Header Editor Docs

```js
(() => {
  const setTheme = (isDark) => {
    window.RSPRESS_THEME = isDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }
  const u = new URLSearchParams(location.search);
  if (u.has("is_dark")) {
    setTheme(u.get("is_dark") === "1");
    return;
  }
  const saved = localStorage.getItem('rspress-theme-appearance');
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(!saved || saved === 'auto' ? preferDark : saved === 'dark');
})();
```
