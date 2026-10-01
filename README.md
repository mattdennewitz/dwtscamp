# dwtscamp

Plays Disturbed's iconic **"ooo-ah-ah-ah"** vocal burst from *Down with the Sickness* before any track plays on [Bandcamp](https://bandcamp.com) (`bandcamp.com` and all `*.bandcamp.com` artist domains).

Both **Google Chrome** (Chromium / Brave / Edge) and **Mozilla Firefox** versions are included.

---

## Repository Structure

```text
dwtscamp/
├── chrome/                      # Chrome / Chromium Manifest V3 extension
│   ├── manifest.json            # Chrome MV3 manifest (service_worker background)
│   ├── bridge.js                # Content bridge passing extension asset URLs
│   ├── content.js               # Main-world audio playback interceptor
│   ├── background.js            # Background service worker
│   ├── disturbed-ooo-ah-ah-ah.mp3 # 48kHz audio clip (2.14s)
│   └── icons/                   # 16px, 48px, 128px PNG icons & vector SVG
│
├── firefox/                     # Firefox Manifest V3 add-on
│   ├── manifest.json            # Firefox MV3 manifest (Gecko ID, background scripts)
│   ├── bridge.js                # Content bridge (browser.* / chrome.* compatible)
│   ├── content.js               # Main-world audio playback interceptor
│   ├── background.js            # Background script
│   ├── disturbed-ooo-ah-ah-ah.mp3 # 48kHz audio clip (2.14s)
│   ├── icons/                   # 16px, 48px, 128px PNG icons & vector SVG
│   └── dwtscamp-firefox.zip      # Packaged add-on ready for loading
│
└── README.md                    # Installation and sideloading documentation
```

---

## Audio Interception Architecture

- **Zero Overlap**: The Bandcamp track is held strictly paused at `currentTime: 0` while the Disturbed intro sound plays. The moment the intro finishes (2.14s), native track playback starts immediately.
- **Deduplication Engine**: Bandcamp internally triggers multiple `play()` invocations per track (click handler, buffering callbacks, and `_handle_canplay`). All concurrent calls are synchronized onto the same intro session promise so only a single intro plays.
- **Mid-Intro Pause Cancellation**: Pausing during the intro immediately cuts off the intro sound and keeps the Bandcamp track paused (preventing delayed playback).
- **Seamless Resume**: Pausing and resuming an already playing track resumes immediately without repeating the intro sound.
- **Track Switching**: Jumping between tracks across album tracklists cancels any active session and initiates the intro for the selected track.

---

## Installation & Sideloading Instructions

### Google Chrome / Chromium / Brave / Edge

#### Sideload as Unpacked Developer Extension:
1. Open Google Chrome (or any Chromium-based browser) and navigate to:
   ```text
   chrome://extensions
   ```
2. Enable **Developer mode** using the toggle switch in the upper-right corner.
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select the `chrome` directory:
   ```text
   /Users/matt/src/dwtscamp/chrome
   ```
5. The extension **dwtscamp** will appear in your extensions list and is active immediately.

---

### Mozilla Firefox

#### Method 1: Temporary Sideload via `about:debugging` (No Signing Required)
1. Open Firefox and navigate to:
   ```text
   about:debugging#/runtime/this-firefox
   ```
2. Click **Load Temporary Add-on…**.
3. Select either:
   - `manifest.json` inside `/Users/matt/src/dwtscamp/firefox/manifest.json`, OR
   - The pre-packaged zip archive: `/Users/matt/src/dwtscamp/firefox/dwtscamp-firefox.zip`.
4. The add-on is loaded and active for your session.

#### Method 2: Permanent Installation (Firefox Developer Edition / Nightly)
Standard release builds of Firefox require extensions to be signed by Mozilla Add-ons (AMO). If you are using Firefox Developer Edition, Nightly, or unbranded builds:
1. Navigate to `about:config` and set:
   ```text
   xpinstall.signatures.required = false
   ```
2. Navigate to `about:addons`.
3. Click the gear icon (⚙) at the top of the page and choose **Install Add-on From File…**.
4. Select `/Users/matt/src/dwtscamp/firefox/dwtscamp-firefox.zip`.
5. Click **Add** when prompted to install permanently.

---

## Verification & Testing

1. Navigate to any album or track on Bandcamp:
   - Example: `https://c418.bandcamp.com/album/one`
2. Click the **Play** button on the page or any track row in the tracklist.
3. Hear Disturbed's *"ooo-ah-ah-ah"* vocal burst play cleanly with the track paused.
4. The track begins playing automatically right as the sound finishes.
5. Hit **Pause** and **Play** again — notice it resumes immediately without repeating the intro.
6. Click another track in the tracklist — the intro plays before the new track begins.
