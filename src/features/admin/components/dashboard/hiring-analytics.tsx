"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientChart } from "@/components/charts/client-chart";
import { GlassCard } from "../shared/glass-card";
import type { AnalyticsData } from "@/features/admin/lib/fetch-analytics";

export function HiringAnalytics({ data }: { data: AnalyticsData }) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const trendData =
    range === "7d"
      ? data.hiringTrend7d
      : range === "30d"
        ? data.hiringTrend30d
        : data.hiringTrend90d;

  const deptData = data.candidatesByDept.length
    ? data.candidatesByDept
    : [{ department: "No data yet", count: 0 }];
  const statusPie = data.candidateStatusPie.length
    ? data.candidateStatusPie
    : [{ name: "No candidates", value: 1, fill: "#7A8798" }];
  const radarData = data.topSkillsRadar.length
    ? data.topSkillsRadar
    : [{ skill: "—", score: 0 }];

  return (
    <div className="space-y-6">
      <GlassCard delay={0.1}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#0B1E3B] dark:text-white">Hiring Trend</h2>
            <p className="text-sm text-muted-foreground">Screened candidates, assessments & hires</p>
          </div>
          <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ClientChart minHeight={280}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="screened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B1E3B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0B1E3B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="screened"
                stroke="#0B1E3B"
                fill="url(#screened)"
                strokeWidth={2}
              />
              <Area type="monotone" dataKey="assessments" stroke="#C8202A" fill="#C8202A20" />
              <Area type="monotone" dataKey="hired" stroke="#1E9E5A" fill="#1E9E5A20" />
            </AreaChart>
          </ResponsiveContainer>
        </ClientChart>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard delay={0.15}>
          <h3 className="mb-4 font-bold text-[#0B1E3B] dark:text-white">Candidates by Department</h3>
          <ClientChart minHeight={240}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="department" type="category" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#C8202A" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ClientChart>
        </GlassCard>

        <GlassCard delay={0.2}>
          <h3 className="mb-4 font-bold text-[#0B1E3B] dark:text-white">Candidate Status</h3>
          <ClientChart minHeight={240}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {statusPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ClientChart>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard delay={0.25}>
          <h3 className="mb-4 font-bold text-[#0B1E3B] dark:text-white">Top Skills Found</h3>
          <ClientChart minHeight={260}>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                <Radar
                  name="Prevalence"
                  dataKey="score"
                  stroke="#0B1E3B"
                  fill="#C8202A"
                  fillOpacity={0.35}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ClientChart>
        </GlassCard>

        <GlassCard delay={0.3}>
          <h3 className="mb-4 font-bold text-[#0B1E3B] dark:text-white">Hiring Activity Heatmap</h3>
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-center text-[10px] font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {data.hiringHeatmap.slice(0, 42).map((cell) => (
              <div
                key={`${cell.day}-${cell.slot}`}
                title={`${cell.day} ${cell.slot}: ${cell.value}`}
                className="aspect-square rounded-md"
                style={{
                  backgroundColor: `rgba(200, 32, 42, ${0.08 + (cell.value / 100) * 0.85})`,
                }}
              />
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
