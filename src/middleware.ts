import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

function isAssessmentDownloadPath(pathname: string): boolean {
  return /^\/api\/assessments\/[^/]+(\/file|\/files\/[^/]+)$/.test(pathname);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isAssessmentDownloadPath(pathname)) {
    return;
  }

  if (
    !req.auth &&
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/health") &&
    !pathname.startsWith("/api/version")
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
