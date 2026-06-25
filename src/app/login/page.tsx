import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function LoginPage() {
  const platform = await getPlatformSettings();

  return (
    <Suspense>
      <SignInForm platform={platform} />
    </Suspense>
  );
}
