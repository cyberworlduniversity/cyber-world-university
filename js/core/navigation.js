(function () {
  const toggle = document.querySelector('.nav-toggle');
  const panel = document.querySelector('.nav-panel');
  if (!toggle || !panel) return;

  function setOpen(open) {
    panel.classList.toggle('open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }

  toggle.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  panel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (!panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
}());
