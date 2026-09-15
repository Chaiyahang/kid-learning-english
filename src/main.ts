import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./styles/main.css";

function disablePageZoom() {
  const preventDefault = (event: Event) => {
    event.preventDefault();
  };
  const preventMultiTouch = (event: TouchEvent) => {
    if (event.touches.length > 1) event.preventDefault();
  };

  document.addEventListener("gesturestart", preventDefault, { passive: false });
  document.addEventListener("gesturechange", preventDefault, { passive: false });
  document.addEventListener("gestureend", preventDefault, { passive: false });
  document.addEventListener("touchstart", preventMultiTouch, { passive: false });
  document.addEventListener("touchmove", preventMultiTouch, { passive: false });
}

disablePageZoom();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  });
}

registerServiceWorker();

createApp(App).use(router).mount("#app");
