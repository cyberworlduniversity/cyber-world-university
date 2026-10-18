(function () {
  document.querySelectorAll('.current-year').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function openDialog(dialog) {
    if (!(dialog instanceof HTMLDialogElement)) {
      throw new TypeError('A native dialog element is required.');
    }
    if (!dialog.open) dialog.showModal();
  }

  function closeDialog(dialog, returnValue) {
    if (!(dialog instanceof HTMLDialogElement)) {
      throw new TypeError('A native dialog element is required.');
    }
    if (dialog.open) dialog.close(returnValue);
  }

  window.CWU = Object.assign(window.CWU || {}, { showToast, escapeHTML, openDialog, closeDialog });
}());
