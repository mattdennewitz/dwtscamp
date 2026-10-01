// Isolated-world content script for Firefox
// Injects content.js into page context and passes audio asset URL

(function () {
  'use strict';

  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  const audioUrl = browserAPI.runtime.getURL('disturbed-ooo-ah-ah-ah.mp3');
  const scriptUrl = browserAPI.runtime.getURL('content.js');

  // Inject meta tag for audio asset lookup
  const meta = document.createElement('meta');
  meta.name = 'disturbed-intro-url';
  meta.content = audioUrl;
  (document.head || document.documentElement).appendChild(meta);

  // Inject main-world script
  const script = document.createElement('script');
  script.src = scriptUrl;
  script.dataset.introUrl = audioUrl;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
})();
