(function () {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const storedTheme = window.CWU.safeStorageGet('cwu-theme');
  let selectedTheme = ['dark', 'light', 'system'].includes(storedTheme)
    ? storedTheme
    : 'system';

  function applyTheme(theme, persist) {
    selectedTheme = ['dark', 'light', 'system'].includes(theme) ? theme : 'system';
    if (selectedTheme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', selectedTheme);
    if (persist) window.CWU.safeStorageSet('cwu-theme', selectedTheme);
    if (!toggle) return;
    const nextTheme = selectedTheme === 'dark' ? 'light' : selectedTheme === 'light' ? 'system' : 'dark';
    toggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    toggle.textContent = selectedTheme === 'system' ? 'System' : selectedTheme === 'light' ? 'Light' : 'Dark';
  }

  applyTheme(selectedTheme, false);
  if (toggle) {
    toggle.addEventListener('click', () => {
      const nextTheme = selectedTheme === 'dark' ? 'light' : selectedTheme === 'light' ? 'system' : 'dark';
      applyTheme(nextTheme, true);
    });
  }
}());
