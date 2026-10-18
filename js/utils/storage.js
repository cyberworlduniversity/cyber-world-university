(function () {
  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn(`Local storage is unavailable while reading "${key}".`, error);
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Local storage is unavailable while saving "${key}".`, error);
      return false;
    }
  }

  window.CWU = Object.assign(window.CWU || {}, { safeStorageGet, safeStorageSet });
}());
