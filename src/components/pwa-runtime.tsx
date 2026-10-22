"use client";

import { Download, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaRuntime() {
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setOnline(navigator.onLine));
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onInstall);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js");
    }
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <>
      {!online && (
        <div className="offline-banner" role="status">
          <WifiOff aria-hidden="true" size={17} />
          You’re offline. Saved pages still work; new lines will wait for a
          connection.
        </div>
      )}
      {installPrompt && !dismissed && (
        <aside className="install-card" aria-label="Install Morrow">
          <div>
            <strong>Keep Morrow close</strong>
            <p>Install the app for a quieter, full-screen writing space.</p>
          </div>
          <button
            className="button button--small"
            onClick={install}
            type="button"
          >
            <Download aria-hidden="true" size={16} />
            Install
          </button>
          <button
            className="icon-button"
            aria-label="Dismiss install suggestion"
            onClick={() => setDismissed(true)}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </aside>
      )}
    </>
  );
}
