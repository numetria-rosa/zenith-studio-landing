import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { initialsOf } from "@/lib/account/data";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { signOutAction } from "./actions";

export const metadata: Metadata = { title: "Student space | Zenith Studio", robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/sign-in?callbackUrl=${encodeURIComponent("/account")}`);
  const user = await db.user.findUnique({ where: { id: userId }, select: { name: true, displayName: true, email: true } });
  if (!user) redirect("/sign-in");
  const name = user.displayName || user.name || user.email;
  return (
    <AccountShell user={{ name, email: user.email, initials: initialsOf(name) }} signOut={signOutAction}>
      {children}
    </AccountShell>
  );
}
