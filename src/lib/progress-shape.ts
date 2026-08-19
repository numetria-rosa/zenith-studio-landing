/* Validates the shape of a CourseProgress.data payload before it's ever
   written to the DB. This is SHAPE validation, not completion verification —
   it guards against garbage/malicious payloads (wrong types, absurd sizes,
   nonsense module ids), it does not and cannot prove a student genuinely
   did the work. Python exercises still grade entirely client-side via
   Pyodide, exactly as before this system existed. See the final report's
   "Progress" section for why that distinction is real and stays real. */

const MAX_PAYLOAD_BYTES = 200_000; // generous for 8 modules of quiz/exercise state, still bounded
const VALID_MODULE_IDS = new Set(["1", "2", "3", "4", "5", "6", "7", "8"]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function validSection(v: unknown): boolean {
  if (v === true || v === false) return true;
  if (isPlainObject(v) && isFiniteNumber(v.total) && isFiniteNumber(v.passCount)) {
    return v.total >= 0 && v.passCount >= 0 && v.passCount <= v.total;
  }
  return false;
}

function validModuleRecord(v: unknown): boolean {
  if (!isPlainObject(v)) return false;
  if (v.score !== undefined && !isFiniteNumber(v.score)) return false;
  if (v.total !== undefined && !isFiniteNumber(v.total)) return false;
  if (isFiniteNumber(v.score) && isFiniteNumber(v.total) && v.score > v.total) return false;
  if (v.completed !== undefined && typeof v.completed !== "boolean") return false;
  if (v.answers !== undefined && !isPlainObject(v.answers)) return false;
  if (v.sections !== undefined) {
    if (!isPlainObject(v.sections)) return false;
    for (const sec of Object.values(v.sections)) {
      if (!validSection(sec)) return false;
    }
  }
  return true;
}

export function validateProgressPayload(raw: unknown): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  let size: number;
  try {
    size = JSON.stringify(raw).length;
  } catch {
    return { ok: false, error: "payload is not serializable" };
  }
  if (size > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: `payload too large (${size} bytes, max ${MAX_PAYLOAD_BYTES})` };
  }
  if (!isPlainObject(raw)) return { ok: false, error: "payload must be an object" };

  const modules = raw.modules;
  if (modules !== undefined) {
    if (!isPlainObject(modules)) return { ok: false, error: "modules must be an object" };
    for (const [key, rec] of Object.entries(modules)) {
      if (!VALID_MODULE_IDS.has(key)) return { ok: false, error: `unknown module id "${key}"` };
      if (!validModuleRecord(rec)) return { ok: false, error: `malformed record for module ${key}` };
    }
  }

  const extra = raw.extra;
  if (extra !== undefined && !isPlainObject(extra)) {
    return { ok: false, error: "extra must be an object" };
  }

  return {
    ok: true,
    data: {
      modules: isPlainObject(modules) ? modules : {},
      extra: isPlainObject(extra) ? extra : {},
    },
  };
}
