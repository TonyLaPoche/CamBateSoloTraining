export type SavedSessionMeta = {
  id: string;
  pseudo: string;
  createdAt: number;
  pumps: number;
  score: number;
  bestCombo: number;
  durationMs: number;
  mimeType: string;
  hasVideo: boolean;
};

const DB_NAME = "cambate-solo-v1";
const DB_VERSION = 1;
const META_STORE = "sessions";
const BLOB_STORE = "blobs";
const PSEUDO_KEY = "cbs-solo-pseudo";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** 4–5 lettres A–Z uniquement */
export function normalizePseudo(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 5);
}

export function isValidPseudo(pseudo: string): boolean {
  return /^[A-Z]{4,5}$/.test(pseudo);
}

export function loadStoredPseudo(): string {
  try {
    const raw = localStorage.getItem(PSEUDO_KEY) ?? "";
    const n = normalizePseudo(raw);
    return isValidPseudo(n) ? n : "";
  } catch {
    return "";
  }
}

export function storePseudo(pseudo: string): void {
  localStorage.setItem(PSEUDO_KEY, normalizePseudo(pseudo));
}

/** Ex: AABB-20-07-2026-22:39 */
export function buildSessionId(pseudo: string, at = new Date()): string {
  const p = normalizePseudo(pseudo);
  const dd = String(at.getDate()).padStart(2, "0");
  const mm = String(at.getMonth() + 1).padStart(2, "0");
  const yyyy = String(at.getFullYear());
  const hh = String(at.getHours()).padStart(2, "0");
  const min = String(at.getMinutes()).padStart(2, "0");
  return `${p}-${dd}-${mm}-${yyyy}-${hh}:${min}`;
}

export async function listSessions(): Promise<SavedSessionMeta[]> {
  const db = await openDb();
  const tx = db.transaction(META_STORE, "readonly");
  const all = await idbReq(tx.objectStore(META_STORE).getAll());
  db.close();
  return (all as SavedSessionMeta[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveSession(input: {
  pseudo: string;
  pumps: number;
  score: number;
  bestCombo: number;
  durationMs: number;
  blob?: Blob | null;
}): Promise<SavedSessionMeta> {
  const createdAt = Date.now();
  let id = buildSessionId(input.pseudo, new Date(createdAt));
  // Évite collision si 2 saves la même minute
  const existing = await listSessions();
  if (existing.some((s) => s.id === id)) {
    id = `${id}-${String(createdAt).slice(-3)}`;
  }

  const meta: SavedSessionMeta = {
    id,
    pseudo: normalizePseudo(input.pseudo),
    createdAt,
    pumps: input.pumps,
    score: Math.floor(input.score),
    bestCombo: input.bestCombo,
    durationMs: input.durationMs,
    mimeType: input.blob?.type || "video/webm",
    hasVideo: Boolean(input.blob && input.blob.size > 0),
  };

  const db = await openDb();
  const tx = db.transaction([META_STORE, BLOB_STORE], "readwrite");
  tx.objectStore(META_STORE).put(meta);
  if (meta.hasVideo && input.blob) {
    tx.objectStore(BLOB_STORE).put({ id, blob: input.blob });
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return meta;
}

export async function getSessionBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  const tx = db.transaction(BLOB_STORE, "readonly");
  const row = await idbReq<{ id: string; blob: Blob } | undefined>(
    tx.objectStore(BLOB_STORE).get(id),
  );
  db.close();
  return row?.blob ?? null;
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([META_STORE, BLOB_STORE], "readwrite");
  tx.objectStore(META_STORE).delete(id);
  tx.objectStore(BLOB_STORE).delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Nom de fichier safe (pas de `:`) */
export function sessionFileName(id: string): string {
  return `cambate-${id.replace(/:/g, "h")}.webm`;
}
