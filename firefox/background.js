// Background script for Bandcamp Disturbed Intro (Firefox)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.runtime.onInstalled.addListener(() => {
  console.log('[Bandcamp Disturbed Intro] Firefox extension installed.');
});
