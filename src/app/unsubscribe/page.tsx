import { redirect } from "next/navigation";
import { unsubscribeByToken } from "@/lib/outreach-admin";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string }>;
}) {
  const { token, done } = await searchParams;

  async function confirm(formData: FormData) {
    "use server";
    const t = String(formData.get("token") || "");
    await unsubscribeByToken(t);
    redirect("/unsubscribe?done=1");
  }

  if (done === "1") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060a] px-6 text-white">
        <p className="text-sm text-white/70">You have been unsubscribed from outreach emails.</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060a] px-6 text-white">
        <p className="text-sm text-white/60">Missing unsubscribe token.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05060a] px-6 text-white">
      <form action={confirm} className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8">
        <input type="hidden" name="token" value={token} />
        <h1 className="text-xl font-semibold">Stop these emails</h1>
        <p className="mt-3 text-sm text-white/60">
          Confirm and we will not send further outreach to this address.
        </p>
        <button type="submit" className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
          Unsubscribe
        </button>
      </form>
    </div>
  );
}
