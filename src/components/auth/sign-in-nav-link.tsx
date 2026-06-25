"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const LOGIN_HREF = "/login?callbackUrl=%2F";

export function SignInNavLink({ className }: { className: string }) {
  const { status } = useSession();

  if (status === "authenticated") {
    return (
      <Link href="/" className={className}>
        My screening
      </Link>
    );
  }

  return (
    <Link href={LOGIN_HREF} className={className}>
      Sign In
    </Link>
  );
}
