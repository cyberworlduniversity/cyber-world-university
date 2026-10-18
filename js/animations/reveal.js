(function () {
  const elements = document.querySelectorAll('.reveal');
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.14 });

  elements.forEach((element) => observer.observe(element));
}());
