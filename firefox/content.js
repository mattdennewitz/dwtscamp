// Bandcamp Disturbed Intro Content Script (Page / MAIN world)
// Reliably intercepts Bandcamp track playback and plays Disturbed's "ooo-ah-ah-ah" before any track begins.

(function () {
  'use strict';

  if (window.__bandcampDisturbedHookInstalled) {
    return;
  }
  window.__bandcampDisturbedHookInstalled = true;

  // Retrieve audio URL passed by bridge.js or DOM meta tag
  function getIntroUrl() {
    if (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.introUrl) {
      return document.currentScript.dataset.introUrl;
    }
    const meta = document.querySelector('meta[name="disturbed-intro-url"]');
    if (meta && meta.content) {
      return meta.content;
    }
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL('disturbed-ooo-ah-ah-ah.mp3');
    }
    return null;
  }

  const cachedIntroUrl = getIntroUrl();

  // Save native media methods
  const origPlay = HTMLMediaElement.prototype.play;
  const origPause = HTMLMediaElement.prototype.pause;

  // Track playback state per media element
  // Key: HTMLMediaElement
  // Value: {
  //   lastSrc: string,
  //   introPlayed: boolean,
  //   pendingPromise: Promise|null,
  //   activeSessionId: number,
  //   cancelCurrentIntro: Function|null
  // }
  const mediaStateMap = new WeakMap();

  let activeIntroAudio = null;
  let nextSessionId = 1;

  function isBandcampTrackAudio(element) {
    if (!(element instanceof HTMLAudioElement || element instanceof HTMLMediaElement)) {
      return false;
    }
    if (element.__isDisturbedIntro) {
      return false;
    }
    const src = element.src || element.currentSrc || '';
    if (cachedIntroUrl && src === cachedIntroUrl) {
      return false;
    }
    return Boolean(src);
  }

  // Intercept HTMLMediaElement.prototype.play
  HTMLMediaElement.prototype.play = function (...args) {
    const el = this;
    const src = el.src || el.currentSrc || '';

    // If this is our intro sound itself, execute native play
    if (el.__isDisturbedIntro) {
      return origPlay.apply(el, args);
    }

    // Pass through non-track elements
    if (!isBandcampTrackAudio(el)) {
      return origPlay.apply(el, args);
    }

    let state = mediaStateMap.get(el);
    if (!state) {
      state = {
        lastSrc: src,
        introPlayed: false,
        pendingPromise: null,
        activeSessionId: 0,
        cancelCurrentIntro: null
      };
      mediaStateMap.set(el, state);
    }

    // If track changed, cancel previous intro and reset state
    if (state.lastSrc !== src) {
      if (state.cancelCurrentIntro) {
        state.cancelCurrentIntro();
      }
      state.lastSrc = src;
      state.introPlayed = false;
      state.pendingPromise = null;
      state.cancelCurrentIntro = null;
    }

    // If intro was already played for this track (e.g. resume after pause), play immediately
    if (state.introPlayed) {
      return origPlay.apply(el, args);
    }

    // Bandcamp triggers multiple play() calls (e.g. from play() and _handle_canplay).
    // Deduplicate so concurrent calls join the same pending intro promise
    if (state.pendingPromise) {
      return state.pendingPromise;
    }

    const soundUrl = cachedIntroUrl || getIntroUrl();
    if (!soundUrl) {
      state.introPlayed = true;
      return origPlay.apply(el, args);
    }

    // Cancel any globally active intro
    if (activeIntroAudio) {
      try {
        origPause.call(activeIntroAudio);
      } catch (e) {
        // ignore
      }
      activeIntroAudio = null;
    }

    const sessionId = ++nextSessionId;
    state.activeSessionId = sessionId;

    let timeoutId = null;
    let introAudio = null;
    let settled = false;

    state.pendingPromise = new Promise((resolve, reject) => {
      introAudio = new Audio(soundUrl);
      introAudio.__isDisturbedIntro = true;
      activeIntroAudio = introAudio;

      try {
        introAudio.volume = typeof el.volume === 'number' ? el.volume : 1.0;
      } catch (e) {
        // ignore
      }

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (state.activeSessionId === sessionId) {
          state.cancelCurrentIntro = null;
          state.pendingPromise = null;
        }
        if (activeIntroAudio === introAudio) {
          activeIntroAudio = null;
        }
      };

      const startTrack = () => {
        if (settled || state.activeSessionId !== sessionId) {
          cleanup();
          return;
        }
        settled = true;
        state.introPlayed = true;
        cleanup();

        origPlay.apply(el, args).then(resolve).catch(reject);
      };

      // Handler for user cancellation (e.g. user pauses or clicks a different track)
      state.cancelCurrentIntro = () => {
        if (settled || state.activeSessionId !== sessionId) return;
        settled = true;
        cleanup();
        try {
          origPause.call(introAudio);
        } catch (e) {
          // ignore
        }
        reject(new DOMException('Playback was aborted by user or track change', 'AbortError'));
      };

      introAudio.addEventListener('ended', startTrack, { once: true });
      introAudio.addEventListener('error', (err) => {
        console.warn('[Bandcamp Disturbed Intro] Error loading intro audio:', err);
        startTrack();
      }, { once: true });

      // Stalling fallback (intro is 2.14s)
      timeoutId = setTimeout(() => {
        if (!settled && state.activeSessionId === sessionId) {
          try {
            origPause.call(introAudio);
          } catch (e) {
            // ignore
          }
          startTrack();
        }
      }, 4000);

      origPlay.call(introAudio).catch((err) => {
        console.warn('[Bandcamp Disturbed Intro] Playback failed or was blocked by browser:', err);
        startTrack();
      });
    });

    return state.pendingPromise;
  };

  // Intercept pause: if user pauses while intro is playing, cancel the intro immediately!
  HTMLMediaElement.prototype.pause = function (...args) {
    const el = this;
    const state = mediaStateMap.get(el);
    if (state && state.cancelCurrentIntro) {
      state.cancelCurrentIntro();
    }
    return origPause.apply(el, args);
  };

  // Reset state when new src is explicitly assigned
  const origSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  if (origSrcDescriptor && origSrcDescriptor.set) {
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      set: function (newSrc) {
        const state = mediaStateMap.get(this);
        if (state && state.lastSrc !== newSrc) {
          if (state.cancelCurrentIntro) {
            state.cancelCurrentIntro();
          }
          state.lastSrc = newSrc;
          state.introPlayed = false;
          state.pendingPromise = null;
        }
        return origSrcDescriptor.set.call(this, newSrc);
      },
      get: origSrcDescriptor.get,
      configurable: true,
      enumerable: true
    });
  }

  console.log('[Bandcamp Disturbed Intro] Content script active with pause cancellation & session tracking.');
})();
