import type { Metadata } from "next";
import "@/styles/login.css";

export const metadata: Metadata = {
  title: "Sign In — HireLens",
  description: "Sign in to your HireLens recruiter or admin account",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="login-shell">{children}</div>;
}
