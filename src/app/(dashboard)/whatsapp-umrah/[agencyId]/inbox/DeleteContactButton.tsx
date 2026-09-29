"use client";

export function DeleteContactButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Permanently delete everything held on this contact - all messages, leads and history? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" style={{ fontSize: 12, color: "var(--zc-error-text)" }}>
        Delete data
      </button>
    </form>
  );
}
