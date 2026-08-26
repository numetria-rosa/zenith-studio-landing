/* The ambient gradient-blobs + grid layer used on /lab and every
   authenticated page under it, so the whole signed-in area reads as one
   product instead of /lab looking designed and everything past sign-in
   looking like a bolted-on admin panel. */
export function GlowBackdrop() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(52,211,153,0.14),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(111,144,255,0.16),transparent_24%),radial-gradient(circle_at_55%_85%,rgba(216,82,255,0.12),transparent_30%)]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:64px_64px]" />
    </div>
  );
}
