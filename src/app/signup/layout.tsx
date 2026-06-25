import type { Metadata } from "next";
import "@/styles/login.css";

export const metadata: Metadata = {
  title: "Sign Up — HireLens",
  description: "Create your HireLens recruiter account",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <div className="login-shell">{children}</div>;
}
