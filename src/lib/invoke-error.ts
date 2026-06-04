/** Parse Supabase functions.invoke error bodies for user-facing messages. */
export function messageFromInvokeError(err: unknown, fallback: string): string {
  const ctxBody = (err as { context?: { body?: string } })?.context?.body;
  if (ctxBody) {
    try {
      const body = JSON.parse(ctxBody) as { message?: string; error?: string };
      if (body.message) return body.message;
      if (body.error === "Unauthorized") return "Session expired. Refresh the page and try again.";
      if (body.error === "missing_key") return "AI analysis is not available right now. Try again later.";
      if (body.error === "service_unavailable") {
        return body.message ?? "Service temporarily unavailable. Please try again shortly.";
      }
      if (typeof body.error === "string") return body.error;
    } catch {
      /* ignore malformed body */
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
