import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

/** How long the one-off "ready to use offline" note stays up. */
const OFFLINE_NOTICE_MS = 5000;

/**
 * Registers the service worker and shows its two notices: the app is ready to
 * work offline, and a new version is waiting.
 *
 * The update is applied only when asked for. Reloading automatically on deploy
 * would throw away a part-finished level, since answers live in component
 * state until every exercise is done.
 */
export default function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const reload = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    reload.current = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
  }, []);

  useEffect(() => {
    if (!offlineReady) return;
    const id = window.setTimeout(() => setOfflineReady(false), OFFLINE_NOTICE_MS);
    return () => window.clearTimeout(id);
  }, [offlineReady]);

  // An update is worth interrupting for; "ready offline" is not, so it waits.
  const showing = needRefresh ? "update" : offlineReady ? "offline" : null;
  if (!showing) return null;

  return (
    <div className="app-toast" role="status">
      {showing === "update" ? (
        <>
          <span>A new version is available.</span>
          <button type="button" className="check-btn" onClick={() => reload.current?.(true)}>
            Reload
          </button>
          <button
            type="button"
            className="app-toast-dismiss"
            onClick={() => setNeedRefresh(false)}
            aria-label="Dismiss, and update later"
          >
            &times;
          </button>
        </>
      ) : (
        <>
          <span>Ready to use offline.</span>
          <button
            type="button"
            className="app-toast-dismiss"
            onClick={() => setOfflineReady(false)}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </>
      )}
    </div>
  );
}
