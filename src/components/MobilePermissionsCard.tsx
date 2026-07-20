import { useCallback, useEffect, useState } from "react";
import {
  cameraConstraints,
  isMobilePerfProfile,
} from "@/lib/devicePerf";

type CamPerm = "unknown" | "prompt" | "granted" | "denied" | "unsupported";

function readPermissionState(state: PermissionState): CamPerm {
  if (state === "granted") return "granted";
  if (state === "denied") return "denied";
  return "prompt";
}

async function queryCameraPermission(): Promise<CamPerm> {
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  try {
    const perms = navigator.permissions;
    if (perms?.query) {
      const status = await perms.query({
        name: "camera" as PermissionName,
      });
      return readPermissionState(status.state);
    }
  } catch {
    // Safari / certains navigateurs : query(camera) non supporté
  }
  return "unknown";
}

function statusLabel(status: CamPerm): string {
  switch (status) {
    case "granted":
      return "Autorisée";
    case "denied":
      return "Refusée";
    case "prompt":
      return "Non demandée";
    case "unsupported":
      return "Indisponible";
    default:
      return "À vérifier";
  }
}

function statusColor(status: CamPerm): string {
  switch (status) {
    case "granted":
      return "text-cbs-primary";
    case "denied":
      return "text-cbs-live";
    default:
      return "text-cbs-accent";
  }
}

/** Petite section home — permissions caméra (surtout mobile / PWA). */
export function MobilePermissionsCard() {
  const [status, setStatus] = useState<CamPerm>("unknown");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [mobile] = useState(() => isMobilePerfProfile());

  const refresh = useCallback(async () => {
    setStatus(await queryCameraPermission());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestCamera = useCallback(async () => {
    setBusy(true);
    setHint(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: cameraConstraints(isMobilePerfProfile()),
      });
      stream.getTracks().forEach((t) => t.stop());
      setStatus("granted");
      setHint("Caméra OK — tu peux entrer dans l’arène.");
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("denied");
        setHint(
          mobile
            ? "Permission refusée. Réactive la caméra dans Réglages → Safari/Chrome → Caméra, puis réessaie."
            : "Permission refusée. Autorise la caméra dans les réglages du navigateur.",
        );
      } else if (name === "NotFoundError") {
        setStatus("unsupported");
        setHint("Aucune caméra détectée sur cet appareil.");
      } else {
        setStatus("unknown");
        setHint(
          e instanceof Error ? e.message : "Impossible d’accéder à la caméra.",
        );
      }
    } finally {
      setBusy(false);
      void refresh();
    }
  }, [mobile, refresh]);

  return (
    <section className="rounded-2xl border border-cbs-bg3 bg-cbs-bg1 p-3 sm:p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cbs-accent sm:text-xs">
            Permissions mobile
          </h3>
          <p className="mt-1.5 text-[11px] leading-snug text-cbs-muted sm:text-xs">
            Sur téléphone, autorise la <strong className="text-white">caméra frontale</strong>{" "}
            avant l’arène. HTTPS requis (GitHub Pages OK).
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border border-cbs-bg3 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusColor(status)}`}
        >
          {statusLabel(status)}
        </span>
      </div>

      <ul className="mt-3 space-y-1.5 text-[11px] text-cbs-muted sm:text-xs">
        <li className="flex gap-2">
          <span className="text-cbs-primary">1.</span>
          <span>Autorise la caméra (bouton ci-dessous).</span>
        </li>
        <li className="flex gap-2">
          <span className="text-cbs-primary">2.</span>
          <span>
            iPhone : Safari → Partager → <em className="text-white">Sur l’écran d’accueil</em>{" "}
            pour le mode app.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-cbs-primary">3.</span>
          <span>
            Si refusée : Réglages système → navigateur → Caméra → Autoriser, puis
            reviens ici.
          </span>
        </li>
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="cbs-btn cbs-btn-primary !min-h-9 !px-3 !py-1.5 !text-xs"
          disabled={busy || status === "unsupported"}
          onClick={() => void requestCamera()}
        >
          {busy
            ? "Demande…"
            : status === "granted"
              ? "Retester la caméra"
              : "Autoriser la caméra"}
        </button>
        <button
          type="button"
          className="cbs-btn cbs-btn-ghost !min-h-9 !px-3 !py-1.5 !text-xs"
          disabled={busy}
          onClick={() => void refresh()}
        >
          Rafraîchir
        </button>
      </div>

      {hint && (
        <p
          className={`mt-2 text-[11px] leading-snug sm:text-xs ${
            status === "granted" ? "text-cbs-primary" : "text-cbs-live"
          }`}
        >
          {hint}
        </p>
      )}
    </section>
  );
}
