(function () {
  const listeners = new Map();

  function on(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('An event listener function is required.');
    }
    const handlers = listeners.get(eventName) || new Set();
    handlers.add(listener);
    listeners.set(eventName, handlers);
    return () => handlers.delete(listener);
  }

  function emit(eventName, detail) {
    (listeners.get(eventName) || []).forEach((listener) => listener(detail));
  }

  window.CWU = Object.assign(window.CWU || {}, { events: { on, emit } });
}());
