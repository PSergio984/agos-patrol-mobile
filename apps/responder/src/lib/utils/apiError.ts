import { isAxiosError } from "axios";

// FastAPI error bodies: `detail` is a string for HTTPException but an array of
// {type, loc, msg, input, ctx} objects on 422 validation errors — rendering it
// raw crashes React ("Objects are not valid as a React child").
function detailToString(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) =>
        d && typeof d === "object" ? (d as { msg?: string }).msg : null
      )
      .filter((m): m is string => typeof m === "string");
    if (msgs.length) return msgs.join(". ");
  }
  return null;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) return fallback;
  const data = err.response?.data as
    { detail?: unknown; message?: unknown } | undefined;
  return (
    detailToString(data?.detail) ??
    (typeof data?.message === "string" ? data.message : null) ??
    fallback
  );
}
