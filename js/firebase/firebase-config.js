(function () {
  const config = Object.freeze({
    apiKey: 'AIzaSyCmIXoj8ouudAIqJm8qwanHotSoybq-OGY',
    authDomain: 'studio-100351834-51432.firebaseapp.com',
    projectId: 'studio-100351834-51432',
    storageBucket: 'studio-100351834-51432.firebasestorage.app',
    messagingSenderId: '939628679878',
    appId: '1:939628679878:web:a12a81b62d81b76699bdc7'
  });

  const isConfigured = [
    config.apiKey,
    config.authDomain,
    config.projectId,
    config.storageBucket,
    config.messagingSenderId,
    config.appId
  ].every((value) => typeof value === 'string' && value.trim().length > 0);

  window.CWU_FIREBASE = Object.freeze({
    config,
    isConfigured,
    appCheckSiteKey: '',
    useEmulators: false
  });
}());
