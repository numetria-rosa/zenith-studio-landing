import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

/* Zenith Lab auth — no NextAuth provider at all. Every sign-in path
   (password, and the post-checkout auto-claim redirect) creates its
   Session row manually via src/lib/session.ts, because there's no email
   sending set up for this project and Auth.js's Credentials provider
   requires JWT sessions anyway. NextAuth here exists only for auth()/
   signOut() and the Prisma adapter's Session table shape — every session
   this app ever creates, regardless of how, lands the same row shape, so
   auth() reads them identically everywhere. Auth.js issues an HttpOnly,
   Secure-in-production, SameSite=Lax cookie that references it. No
   session secret or DB credential is ever sent to the browser — the
   client only ever holds an opaque session token. */
export const { handlers, auth, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  providers: [],
  pages: {
    signIn: "/sign-in",
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
