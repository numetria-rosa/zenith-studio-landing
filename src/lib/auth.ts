import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

/* Zenith Lab auth — email magic link only (Phase 7). The Prisma adapter
   stores the session server-side (Session table); Auth.js issues an
   HttpOnly, Secure-in-production, SameSite=Lax cookie that references it.
   No session secret or DB credential is ever sent to the browser — the
   client only ever holds an opaque session token. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" }, // required for the Email/magic-link provider
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "Zenith Lab <onboarding@resend.dev>",
    }),
  ],
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/check-email",
  },
  callbacks: {
    // Database session strategy hands back the DB `user` row (not a JWT
    // token) — attach its id so every server route can trust
    // `session.user.id` without re-deriving it from anything client-supplied.
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
