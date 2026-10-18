(function () {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');

  root.setAttribute('data-theme', 'dark');
  root.style.colorScheme = 'dark';

  if (toggle) {
    toggle.setAttribute('hidden', 'true');
    toggle.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('disabled', 'true');
    toggle.style.display = 'none';
  }
}());
