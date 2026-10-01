// Background script for dwtscamp (Firefox)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.runtime.onInstalled.addListener(() => {
  console.log('[dwtscamp] Firefox extension installed.');
});
