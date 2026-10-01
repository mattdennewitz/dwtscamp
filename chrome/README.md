# Bandcamp Disturbed Intro Chrome Extension

Plays Disturbed's iconic "ooo-ah-ah-ah" vocal burst from *Down with the Sickness* before any track begins playing on Bandcamp (`bandcamp.com` and all `*.bandcamp.com` artist domains).

## Features

- **Zero Audio Overlap**: Defers and holds the Bandcamp track paused at `currentTime: 0` until the Disturbed intro sound finishes, then immediately begins playback of the actual track.
- **Deduplication Engine**: Bandcamp internally issues multiple `play()` invocations (initial click, media buffering events, and `_handle_canplay`). The extension synchronizes these calls using an active session promise so only a single intro plays.
- **Seamless Pause & Resume**: Pausing and resuming an already playing track resumes playback instantly without re-triggering the intro.
- **Mid-Intro Pause Cancellation**: If you hit pause while the intro sound is playing, the intro sound halts immediately and the track is kept paused (does not accidentally start when the intro timer ends).
- **Track Switch Handling**: Selecting next/previous tracks or jumping through an album resets state and plays the intro before each new track begins.

## Files

- `manifest.json`: Manifest V3 specification configuring content scripts and web-accessible resources.
- `bridge.js`: Isolated-world bridge script providing access to the extension's packaged audio URL.
- `content.js`: Main-world audio interceptor overriding `HTMLMediaElement.prototype.play` and `pause`.
- `disturbed-ooo-ah-ah-ah.mp3`: 48kHz stereo clip of Disturbed's vocal intro burst.
- `icons/`: Extension icons (16px, 48px, 128px, and vector SVG).

## Installation

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `/Users/matt/src/ooo-ah-ah-ah-ah` directory.
4. Visit any album or track on [Bandcamp](https://bandcamp.com) (e.g. `https://c418.bandcamp.com/album/one`) and press **Play**!
