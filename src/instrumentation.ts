import type { Instrumentation } from "next";

// Emails the admin the real error behind any server 500. Production error
// pages hide the message, and nobody would otherwise know a client hit one.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const e = err as Error & { digest?: string };
  const { sendAdminAlert } = await import("@/lib/outreach-mail");
  await sendAdminAlert(
    `Server error on ${request.path}`,
    [
      `${request.method} ${request.path}`,
      `Route: ${context.routePath} (${context.routeType})`,
      `Digest: ${e.digest ?? "-"}`,
      "",
      e.stack?.split("\n").slice(0, 12).join("\n") ?? String(err),
    ].join("\n")
  ).catch(() => {});
};
