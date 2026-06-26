import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  ClipboardList,
  FileText,
  FileBarChart,
  Brain,
  Mail,
  Building2,
  ScrollText,
  CreditCard,
  User,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

/** Single source of truth for admin sidebar + admin login feature list */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Recruiters", href: "/admin/recruiters", icon: Users },
  { title: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { title: "Candidates", href: "/admin/candidates", icon: UserCheck },
  { title: "Assessments", href: "/admin/assessments", icon: ClipboardList },
  { title: "Job Descriptions", href: "/admin/job-descriptions", icon: FileText },
  { title: "Reports", href: "/admin/reports", icon: FileBarChart },
  { title: "AI Analytics", href: "/admin/analytics", icon: Brain },
  { title: "Email Templates", href: "/admin/templates", icon: Mail },
  { title: "Company Settings", href: "/admin/settings", icon: Building2 },
  { title: "System Logs", href: "/admin/logs", icon: ScrollText },
  { title: "Billing", href: "/admin/billing", icon: CreditCard },
  { title: "Profile", href: "/admin/profile", icon: User },
];

/** Highlights shown on the admin login brand panel */
export function getAdminLoginFeatures(): string[] {
  const byTitle = (title: string) => ADMIN_NAV_ITEMS.find((i) => i.title === title)!.title;
  return [
    byTitle("Dashboard"),
    `${byTitle("Recruiters")} & ${byTitle("Jobs")}`,
    `${byTitle("Assessments")} & ${byTitle("Email Templates")}`,
    `${byTitle("Reports")} & ${byTitle("AI Analytics")}`,
    byTitle("Company Settings"),
  ];
}
