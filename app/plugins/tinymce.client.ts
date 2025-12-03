export default defineNuxtPlugin(() => {
  // This plugin is for client-side only since TinyMCE is a browser-only library
  if (import.meta.client) {
    // TinyMCE will be loaded when the component is used
    }
})
