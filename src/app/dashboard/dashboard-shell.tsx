"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  LayoutDashboard,
  Briefcase,
  Upload,
  Users,
  ClipboardList,
  FileBarChart,
  User,
} from "lucide-react";
import type { Role } from "@prisma/client";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: "Upload Job", href: "/dashboard/jobs/new", icon: <Briefcase className="h-4 w-4" /> },
  { title: "Upload Resumes", href: "/dashboard/upload", icon: <Upload className="h-4 w-4" /> },
  { title: "Candidates", href: "/dashboard/candidates", icon: <Users className="h-4 w-4" /> },
  { title: "Assessments", href: "/dashboard/assessments", icon: <ClipboardList className="h-4 w-4" /> },
  { title: "Reports", href: "/dashboard/reports", icon: <FileBarChart className="h-4 w-4" /> },
  { title: "Profile", href: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
];

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; role: Role };
}) {
  return (
    <AppShell navItems={navItems} title="RECRUITER PANEL">
      {children}
    </AppShell>
  );
}
