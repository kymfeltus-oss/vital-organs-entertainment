/**
 * Inline script run before React hydrates.
 * Best-effort mobile browser chrome minimization for domain launch (no app store).
 *
 * - In a normal mobile browser tab: collapses URL bar / bottom nav where OS allows.
 * - In standalone (Add to Home Screen): manifest already removes browser chrome.
 */
export const BROWSER_CHROME_MINIMIZE_SCRIPT = `
(function () {
  var doc = document.documentElement;
  var body = document.body;

  function syncVisualViewport() {
    var vv = window.visualViewport;
    var height = vv ? vv.height : window.innerHeight;
    var offsetTop = vv ? vv.offsetTop : 0;
    doc.style.setProperty("--app-visual-height", Math.round(height) + "px");
    doc.style.setProperty("--app-visual-offset-top", Math.round(offsetTop) + "px");
  }

  function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.navigator.standalone === true
    );
  }

  syncVisualViewport();

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncVisualViewport);
    window.visualViewport.addEventListener("scroll", syncVisualViewport);
  }
  window.addEventListener("orientationchange", syncVisualViewport);
  window.addEventListener("resize", syncVisualViewport);

  if (!isMobile() || isStandalone()) return;

  doc.classList.add("browser-chrome-minimize");
  body.classList.add("browser-chrome-minimize");

  function nudgeChromeAway() {
    syncVisualViewport();
    if (window.scrollY < 2) {
      window.scrollTo(0, 1);
    }
  }

  requestAnimationFrame(nudgeChromeAway);
  window.addEventListener("load", nudgeChromeAway, { once: true });
  window.addEventListener(
    "touchstart",
    function once() {
      nudgeChromeAway();
      window.removeEventListener("touchstart", once, true);
    },
    { capture: true, passive: true }
  );
  window.addEventListener("orientationchange", function () {
    window.setTimeout(nudgeChromeAway, 300);
  });
})();
`.trim();
