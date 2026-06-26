import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/login/")) return true;
  return false;
}

function isAssessmentDownloadPath(pathname: string): boolean {
  return /^\/api\/assessments\/[^/]+(\/file|\/files\/[^/]+)$/.test(pathname);
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "RECRUITER";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/health") || pathname.startsWith("/api/version")) {
        return true;
      }

      if (isAssessmentDownloadPath(pathname)) {
        return true;
      }

      if (isPublicPath(pathname)) {
        return true;
      }

      if (!isLoggedIn) {
        const loginUrl = new URL("/login", request.nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
      }

      if (pathname.startsWith("/admin") && auth.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/", request.nextUrl));
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
