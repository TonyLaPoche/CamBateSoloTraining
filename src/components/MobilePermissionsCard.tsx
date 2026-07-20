import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
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
    /* Safari */
  }
  return "unknown";
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

export function MobilePermissionsCard() {
  const { t } = useI18n();
  const [status, setStatus] = useState<CamPerm>("unknown");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [mobile] = useState(() => isMobilePerfProfile());

  const statusLabel = (s: CamPerm): string => {
    switch (s) {
      case "granted":
        return t("permissions.statusGranted");
      case "denied":
        return t("permissions.statusDenied");
      case "prompt":
        return t("permissions.statusPrompt");
      case "unsupported":
        return t("permissions.statusUnsupported");
      default:
        return t("permissions.statusUnknown");
    }
  };

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
      stream.getTracks().forEach((tr) => tr.stop());
      setStatus("granted");
      setHint(t("permissions.okHint"));
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("denied");
        setHint(
          mobile
            ? t("permissions.deniedMobile")
            : t("permissions.deniedDesktop"),
        );
      } else if (name === "NotFoundError") {
        setStatus("unsupported");
        setHint(t("permissions.noCamera"));
      } else {
        setStatus("unknown");
        setHint(
          e instanceof Error ? e.message : t("permissions.errorFallback"),
        );
      }
    } finally {
      setBusy(false);
      void refresh();
    }
  }, [mobile, refresh, t]);

  return (
    <section className="rounded-2xl border border-cbs-bg3 bg-cbs-bg1 p-3 sm:p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cbs-accent sm:text-xs">
            {t("permissions.title")}
          </h3>
          <p className="mt-1.5 text-[11px] leading-snug text-cbs-muted sm:text-xs">
            {t("permissions.blurbBefore")}{" "}
            <strong className="text-white">{t("permissions.blurbCam")}</strong>{" "}
            {t("permissions.blurbAfter")}
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
          <span>{t("permissions.step1")}</span>
        </li>
        <li className="flex gap-2">
          <span className="text-cbs-primary">2.</span>
          <span>
            {t("permissions.step2Before")}{" "}
            <em className="text-white">{t("permissions.step2Home")}</em>{" "}
            {t("permissions.step2After")}
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-cbs-primary">3.</span>
          <span>{t("permissions.step3")}</span>
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
            ? t("permissions.requesting")
            : status === "granted"
              ? t("permissions.retest")
              : t("permissions.allow")}
        </button>
        <button
          type="button"
          className="cbs-btn cbs-btn-ghost !min-h-9 !px-3 !py-1.5 !text-xs"
          disabled={busy}
          onClick={() => void refresh()}
        >
          {t("permissions.refresh")}
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
