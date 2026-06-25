"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signupSchema } from "@/lib/validations";
import { signupAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, Mail, Lock, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { toast } from "sonner";

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [loading, setLoading] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: SignupFormData) {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("name", data.name);
      fd.set("email", data.email);
      fd.set("password", data.password);
      fd.set("confirmPassword", data.confirmPassword);

      const result = await signupAction(fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Account created — signing you in…");

      const login = await signIn("credentials", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        rememberMe: "false",
        redirect: false,
      });

      if (login?.error || login?.ok === false) {
        toast.info("Account created. Please sign in.");
        window.location.assign("/login");
        return;
      }

      window.location.assign("/");
    } catch {
      toast.error("Sign up failed. Please try again.");
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
                <div className="login-page__logo-sub">RECRUITER WORKSPACE</div>
              </div>
            </div>
            <h2 className="login-page__headline">
              Join Hire<span>Lens</span> today
            </h2>
            <p className="login-page__tagline">
              Create your account, then start screening candidates on the landing page — JD upload,
              live processing, and ranked reports.
            </p>
            <ul className="login-page__features">
              <li>Screen up to 200 resumes per batch</li>
              <li>AI-powered scoring & ranking</li>
              <li>One-click assessment send</li>
            </ul>
          </div>
        </div>

        <div className="login-page__card-wrap">
          <div className="login-card">
            <Link
              href="/login"
              className="mb-4 inline-flex items-center text-sm font-medium text-[#7A8798] hover:text-[#C8202A]"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>

            <div className="login-card__header">
              <h1 className="login-card__title">Create your account</h1>
              <p className="login-card__subtitle">
                Free recruiter account — stored securely in your database.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="login-card__form">
              <div className="login-field">
                <Label htmlFor="name">Full name</Label>
                <div className="login-field__input-wrap">
                  <User className="login-field__icon" />
                  <Input id="name" className="login-field__input" {...form.register("name")} />
                </div>
                {form.formState.errors.name && (
                  <p className="login-field__error">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="login-field">
                <Label htmlFor="email">Work email</Label>
                <div className="login-field__input-wrap">
                  <Mail className="login-field__icon" />
                  <Input
                    id="email"
                    type="email"
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
                <Label htmlFor="password">Password</Label>
                <div className="login-field__input-wrap">
                  <Lock className="login-field__icon" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="login-field__input"
                    {...form.register("password")}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="login-field__error">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="login-field">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="login-field__input-wrap">
                  <Lock className="login-field__icon" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="login-field__input"
                    {...form.register("confirmPassword")}
                  />
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="login-field__error">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="login-card__submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="login-card__signup-prompt">
              Already have an account?{" "}
              <Link href="/login" className="login-card__signup-link">
                Sign in
              </Link>
            </p>

            <p className="login-card__footer">
              Demo: <code>recruiter@dotmappers.in</code> / <code>recruiter123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
