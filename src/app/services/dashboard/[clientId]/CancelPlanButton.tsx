"use client";

export function CancelPlanButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Cancel your plan? You'll keep access until the end of the current billing period.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-[#ff8585]/40 bg-[#ff8585]/10 px-4 py-2 text-[12.5px] font-bold text-[#ff8585] transition hover:bg-[#ff8585]/20"
      >
        Cancel plan
      </button>
    </form>
  );
}
