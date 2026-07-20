import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "cbs-pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** Bandeau : Install (Chrome/Android) ou consignes iOS. */
export function PwaInstallHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosTip, setShowIosTip] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (isIos()) {
      setShowIosTip(true);
      setVisible(true);
    }

    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setDeferred(null);
    setShowIosTip(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }, [deferred]);

  if (!visible) return null;

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-cbs-bg3 bg-cbs-bg1/95 px-3 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-md sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white sm:text-sm">
            Installer l’app
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-cbs-muted sm:text-xs">
            {showIosTip && !deferred
              ? "Safari → Partager → Sur l’écran d’accueil (plein écran, plus confortable)."
              : "Ajoute-la à l’écran d’accueil pour un mode plein écran."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          {deferred && (
            <button
              type="button"
              className="cbs-btn cbs-btn-primary !min-h-9 !px-3 !py-1.5 !text-xs"
              onClick={() => void install()}
            >
              Installer
            </button>
          )}
          <button
            type="button"
            className="cbs-btn cbs-btn-ghost !min-h-9 !px-3 !py-1.5 !text-xs"
            onClick={dismiss}
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
