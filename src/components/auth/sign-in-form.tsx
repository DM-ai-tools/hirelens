"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import { normalizeEmail, resolveCallbackUrl } from "@/lib/auth-utils";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Lock, ArrowRight, ArrowLeft, Shield, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { toast } from "sonner";
import type { PlatformSettings } from "@/lib/platform-settings";

type LoginForm = z.infer<typeof loginSchema>;

async function fetchSessionRole(): Promise<"ADMIN" | "RECRUITER" | undefined> {
  try {
    const res = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
    if (!res.ok) return undefined;
    const session = await res.json();
    return session?.user?.role;
  } catch {
    return undefined;
  }
}

export function SignInForm({ platform }: { platform: PlatformSettings }) {
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const callback = searchParams.get("callbackUrl");
  const continueDest = resolveCallbackUrl(callback, session?.user?.role);

  if (sessionStatus === "authenticated" && session?.user) {
    const continueLabel =
      session.user.role === "ADMIN" ? "Continue to admin →" : "Continue to screening →";

    return (
      <div className="login-page">
        <div className="login-page__bg" aria-hidden />
        <ThemeToggle variant="floating" />
        <div className="login-page__card-wrap min-h-screen">
          <div className="login-card w-full max-w-md">
            <h1 className="login-card__title">You&apos;re signed in</h1>
            <p className="login-card__subtitle">
              Signed in as <b>{session.user.email}</b>.
            </p>
            <a
              href={continueDest}
              className="login-card__submit"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textDecoration: "none",
                color: "#fff",
              }}
            >
              {continueLabel}
            </a>
            <button
              type="button"
              className="login-card__signout"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    const email = normalizeEmail(data.email);

    try {
      const result = await signIn("credentials", {
        email,
        password: data.password,
        rememberMe: String(data.rememberMe ?? false),
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "Configuration") {
          toast.error("Sign-in service error. Restart the dev server and run npm run db:setup.");
        } else {
          toast.error("Invalid email or password");
        }
        return;
      }
      if (result?.ok === false) {
        toast.error("Invalid email or password");
        return;
      }

      toast.success("Welcome back!");

      const callback = searchParams.get("callbackUrl");
      let role = await fetchSessionRole();
      if (!role) {
        await new Promise((r) => setTimeout(r, 150));
        role = await fetchSessionRole();
      }

      const dest = resolveCallbackUrl(callback, role);
      window.location.assign(dest);
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__bg" aria-hidden />
      <ThemeToggle variant="floating" />

      <div className="login-page__inner">
        <div className="login-page__brand hidden lg:flex">
          <div className="login-page__brand-inner">
            <div className="login-page__logo">
              <span className="login-page__logo-mark">HL</span>
              <div>
                <div className="login-page__logo-title">
                  Hire<span>Lens</span>
                </div>
                <div className="login-page__logo-sub">AI CANDIDATE SCREENING</div>
              </div>
            </div>
            <h2 className="login-page__headline">
              Screen resumes on the <span>landing page</span>
            </h2>
            <p className="login-page__tagline">
              Sign in, upload your JD and resumes, then review the ranked shortlist — processing
              to report in under 90 seconds.
            </p>
            <ul className="login-page__features">
              <li>Landing → start screening</li>
              <li>Live processing view</li>
              <li>Downloadable report</li>
            </ul>
          </div>
        </div>

        <div className="login-page__card-wrap">
          <div className="login-card">
            <Link
              href="/"
              className="mb-4 inline-flex items-center text-sm font-medium text-[#7A8798] hover:text-[#C8202A]"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to landing
            </Link>

            <div className="login-card__header">
              <h1 className="login-card__title">Welcome back</h1>
              <p className="login-card__subtitle">Sign in to your account</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="login-card__form">
              <div className="login-field">
                <Label htmlFor="email">Email address</Label>
                <div className="login-field__input-wrap">
                  <Mail className="login-field__icon" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="login-field__input"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="login-field__error">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="login-field">
                <div className="login-field__label-row">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="login-field__link"
                    onClick={() => toast.info(`Contact ${platform.contactEmail} to reset your password.`)}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="login-field__input-wrap">
                  <Lock className="login-field__icon" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="login-field__input"
                    {...form.register("password")}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="login-field__error">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="login-card__row">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={form.watch("rememberMe")}
                    onCheckedChange={(v) => form.setValue("rememberMe", !!v)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    Keep me signed in
                  </Label>
                </div>
              </div>

              <Button type="submit" className="login-card__submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="login-card__signup-prompt">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="login-card__signup-link">
                Create one free
              </Link>
            </p>

            <p className="login-card__footer">
              Demo: <code>recruiter@dotmappers.in</code> / <code>recruiter123</code>
            </p>

            <div className="login-admin-divider">
              <span>Admin access</span>
            </div>

            <Link href="/login/admin" className="login-admin-portal">
              <span className="login-admin-portal__icon">
                <Shield className="h-5 w-5" />
              </span>
              <span className="login-admin-portal__text">
                <b>Admin Portal</b>
                <small>Administrator access for {platform.companyName}</small>
              </span>
              <ChevronRight className="login-admin-portal__chevron" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
