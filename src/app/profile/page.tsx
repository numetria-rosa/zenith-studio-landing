import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

/** The profile (password included) now lives in the student space. Old links and course rails land there. */
export default function ProfilePage() {
  redirect("/account/profile");
}
