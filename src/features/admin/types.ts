export type PipelineStage = {
  id: string;
  label: string;
  count: number;
  percentage: number;
  conversionRate: number;
};

export type DashboardKpi = {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  accent: "navy" | "red" | "green" | "amber" | "neutral";
};

export type RecruiterLeaderboardRow = {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  jobsCreated: number;
  candidatesReviewed: number;
  reportsGenerated: number;
  avgCandidateScore: number;
  hiringSuccess: number;
  completionRate: number;
  avatarInitials: string;
};

export type ActivityItem = {
  id: string;
  type:
    | "resume_upload"
    | "candidate_screened"
    | "assessment_sent"
    | "job_created"
    | "recruiter_added"
    | "report_generated"
    | "email_delivered"
    | "login";
  title: string;
  description: string;
  actor: string;
  timestamp: string;
};

export type JobCard = {
  id: string;
  title: string;
  department: string | null;
  status: string;
  applicants: number;
  goodCandidates: number;
  avgScore: number;
  createdBy: string;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  time: string;
  read: boolean;
};

import type { AnalyticsData } from "@/features/admin/lib/fetch-analytics";

export type DashboardStats = {
  adminName: string;
  kpis: DashboardKpi[];
  pipeline: PipelineStage[];
  recruiters: RecruiterLeaderboardRow[];
  activity: ActivityItem[];
  jobs: JobCard[];
  storageUsedPct: number;
  apiUsagePct: number;
  currentPlan: string;
  appVersion: string;
  analytics: AnalyticsData;
};
