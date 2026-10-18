(function () {
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      child.style.setProperty('--stagger-index', String(index));
    });
  });

  document.querySelectorAll('[data-tabs]').forEach((tabList) => {
    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        tabs.forEach((candidate) => {
          const selected = candidate === tab;
          candidate.setAttribute('aria-selected', String(selected));
          candidate.tabIndex = selected ? 0 : -1;
          const panel = document.getElementById(candidate.getAttribute('aria-controls'));
          if (panel) panel.hidden = !selected;
        });
      });

      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0
          : event.key === 'End' ? tabs.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      });
    });
  });
}());
