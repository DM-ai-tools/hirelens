"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import { normalizeEmail, resolveCallbackUrl } from "@/lib/auth-utils";
import type { LoginPageConfig } from "@/lib/login-content";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LoginBrandPanel } from "@/components/auth/login-brand-panel";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

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

export function RoleLoginForm({
  role,
  config,
  backHref = "/login",
}: {
  role: Role;
  config: LoginPageConfig;
  backHref?: string;
}) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { brand, content } = config;

  const defaultRedirect = role === "ADMIN" ? "/admin" : "/";

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

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
      let sessionRole = await fetchSessionRole();
      if (!sessionRole) {
        await new Promise((r) => setTimeout(r, 150));
        sessionRole = await fetchSessionRole();
      }

      if (role === "ADMIN" && sessionRole !== "ADMIN") {
        toast.error("This account does not have administrator access.");
        await signOut({ redirect: false });
        return;
      }
      const dest = resolveCallbackUrl(callback, sessionRole ?? role, defaultRedirect);
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
        <LoginBrandPanel brand={brand} content={content} />

        <div className="login-page__card-wrap">
          <div className="login-card">
            <Link
              href={backHref}
              className="mb-4 inline-flex items-center text-sm font-medium text-[#7A8798] hover:text-[#C8202A]"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>

            <div className="login-card__header">
              <h1 className="login-card__title">{content.cardTitle}</h1>
              <p className="login-card__subtitle">{content.cardSubtitle}</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="login-card__form">
              <div className="login-field">
                <Label htmlFor="email">Email</Label>
                <div className="login-field__input-wrap">
                  <Mail className="login-field__icon" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={brand.contactEmail}
                    className="login-field__input"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="login-field__error">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="login-field">
                <Label htmlFor="password">Password</Label>
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
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-[#C8202A] hover:underline"
                  onClick={() => toast.info(content.supportMessage)}
                >
                  Forgot password?
                </button>
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

            {content.demoEmail && content.demoPasswordHint && (
              <p className="login-card__footer">
                Demo: <code>{content.demoEmail}</code> / <code>{content.demoPasswordHint}</code>
              </p>
            )}

            <p className="login-card__signup-prompt">
              <Link href="/login" className="login-card__signup-link">
                ← Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
