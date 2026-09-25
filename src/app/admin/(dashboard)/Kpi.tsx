import Link from "next/link";

export function Kpi({ href, label, value, sub, warn, need, numeric = true }: { href?: string; label: string; value: string | number; sub?: React.ReactNode; warn?: boolean; need?: boolean; numeric?: boolean }) {
  const cls = `kpi${warn ? " warn" : ""}${need ? " need" : ""}`;
  const inner = (
    <>
      <span>{label}</span>
      <b className={numeric ? "num" : undefined}>{value}</b>
      {sub && <small>{sub}</small>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}
