"use client";

import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
import { GlassCard } from "@/features/admin/components/shared/glass-card";
import { MetricCard } from "@/features/admin/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsData } from "@/features/admin/lib/fetch-analytics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatMetric(value: number | null, suffix = ""): string {
  if (value == null) return "—";
  return `${value}${suffix}`;
}

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const kpis = [
    { id: "1", label: "Avg AI Score", value: formatMetric(data.avgAiScore, "%"), accent: "navy" as const },
    {
      id: "2",
      label: "Avg Experience Intelligence",
      value: formatMetric(data.avgExperienceIntelligence),
      accent: "green" as const,
    },
    { id: "3", label: "Avg Skill Match", value: formatMetric(data.avgSkillMatch, "%"), accent: "red" as const },
    {
      id: "4",
      label: "Hiring Success Prediction",
      value: formatMetric(data.hiringSuccessPrediction, "%"),
      accent: "amber" as const,
    },
  ];

  const skillData = data.skillFrequency.length
    ? data.skillFrequency
    : [{ skill: "No data", count: 0 }];

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <AdminPageHeader
        title="AI Analytics"
        description="Claude-powered insights across screening quality, skills, and hiring predictions."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <MetricCard key={k.id} kpi={k} index={i} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h3 className="mb-4 font-bold">Top Matching Skills</h3>
          {data.topMatchingSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {data.topMatchingSkills.map((s) => (
                <Badge key={s} className="bg-[#E8F8EF] text-[#1E9E5A] hover:bg-[#E8F8EF]">
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No screened candidates yet.</p>
          )}
          <h3 className="mb-3 mt-6 font-bold">Top Missing Skills</h3>
          {data.topMissingSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {data.topMissingSkills.map((s) => (
                <Badge key={s} variant="destructive">
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No skill gaps identified yet.</p>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="mb-4 font-bold">Skill Match Frequency</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="skill" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0B1E3B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="mb-4 font-bold">Most Common Technologies</h3>
        {data.topTechnologies.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.topTechnologies.map((tech) => (
              <div
                key={tech.name}
                className="flex items-center justify-between rounded-xl border border-[#E5E9F0] px-4 py-3 dark:border-white/10"
              >
                <span className="font-medium">{tech.name}</span>
                <span className="text-sm text-muted-foreground">{tech.pct}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No technology data available yet.</p>
        )}
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="border-[#E0A106]/30">
          <h3 className="font-bold">Duplicate Resume Detection</h3>
          <p className="mt-2 text-3xl font-bold text-[#E0A106]">{data.duplicateResumes}</p>
          <p className="text-sm text-muted-foreground">Duplicate email addresses detected</p>
        </GlassCard>
        <GlassCard className="border-[#C8202A]/30">
          <h3 className="font-bold">Failed Screenings</h3>
          <p className="mt-2 text-3xl font-bold text-[#C8202A]">{data.fraudFlags}</p>
          <p className="text-sm text-muted-foreground">Candidates that failed processing</p>
        </GlassCard>
      </div>
    </div>
  );
}
