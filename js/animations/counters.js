(function () {
  const counters = document.querySelectorAll('.count[data-target]');
  if (!counters.length) return;

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setFinalValue(element) {
    const target = Number(element.dataset.target);
    element.textContent = `${target}${target >= 1000 ? '+' : ''}`;
  }

  function animate(element) {
    const target = Number(element.dataset.target);
    if (!Number.isFinite(target)) return;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / 850, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = `${Math.round(target * eased)}${target >= 1000 ? '+' : ''}`;
      if (progress < 1) window.requestAnimationFrame(update);
    }

    window.requestAnimationFrame(update);
  }

  if (reducedMotion || !('IntersectionObserver' in window)) {
    counters.forEach(setFinalValue);
    return;
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.45 });

  counters.forEach((counter) => observer.observe(counter));
}());
