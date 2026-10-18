(function () {
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  }

  function isNonEmpty(value) {
    return String(value).trim().length > 0;
  }

  window.CWU = Object.assign(window.CWU || {}, {
    validation: { isValidEmail, isNonEmpty }
  });
}());
