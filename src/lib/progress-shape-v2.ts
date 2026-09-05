/* Shape validator for "react"-render-mode courses' progress payloads (see
   src/lib/courses.ts's renderMode field). Deliberately a separate file from
   progress-shape.ts rather than a loosened version of it: that validator's
   VALID_MODULE_IDS ("1".."9") and quiz-style shape are load-bearing for the
   4 existing static courses' data already in the DB, and one shared function
   gates all of them - widening it in place risks silently accepting
   malformed data for those courses too. This validator is scoped to the
   simpler per-lesson shape a react course's MDX pages actually write:
   { modules: { [lessonId]: { completed, score?, total?, answers? } }, extra }.
   Module ids are validated per-course against that course's own lesson
   manifest length, not a hardcoded ceiling. */

const MAX_PAYLOAD_BYTES = 200_000;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function validModuleRecord(v: unknown): boolean {
  if (!isPlainObject(v)) return false;
  if (v.score !== undefined && !isFiniteNumber(v.score)) return false;
  if (v.total !== undefined && !isFiniteNumber(v.total)) return false;
  if (isFiniteNumber(v.score) && isFiniteNumber(v.total) && v.score > v.total) return false;
  if (v.completed !== undefined && typeof v.completed !== "boolean") return false;
  if (v.answers !== undefined && !isPlainObject(v.answers)) return false;
  if (v.sections !== undefined && !isPlainObject(v.sections)) return false;
  return true;
}

export function validateReactCourseProgress(
  raw: unknown,
  maxModuleId: number
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
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
      const id = Number(key);
      if (!Number.isInteger(id) || id < 1 || id > maxModuleId) {
        return { ok: false, error: `unknown module id "${key}"` };
      }
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
