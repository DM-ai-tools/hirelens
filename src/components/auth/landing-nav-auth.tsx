"use client";

import { signOut, useSession } from "next-auth/react";

const SIGN_IN_HREF = "/login";

export function LandingNavAuth() {
  const { status } = useSession();

  if (status === "authenticated") {
    return (
      <button
        type="button"
        className="btn-nav-outline"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Sign Out
      </button>
    );
  }

  return (
    <a href={SIGN_IN_HREF} className="btn-nav-outline">
      Sign In
    </a>
  );
}
