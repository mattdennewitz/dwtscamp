// Isolated-world content script
// Injects content.js into the MAIN world and passes the extension's audio asset URL

(function () {
  'use strict';

  const audioUrl = chrome.runtime.getURL('disturbed-ooo-ah-ah-ah.mp3');
  const scriptUrl = chrome.runtime.getURL('content.js');

  // Inject meta tag or dataset so the main-world script knows the audio URL immediately
  const meta = document.createElement('meta');
  meta.name = 'disturbed-intro-url';
  meta.content = audioUrl;
  (document.head || document.documentElement).appendChild(meta);

  // Inject the main world script
  const script = document.createElement('script');
  script.src = scriptUrl;
  script.dataset.introUrl = audioUrl;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
})();
