"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const hiringActivity = [
  { month: "Jan", screenings: 12, hires: 3 },
  { month: "Feb", screenings: 18, hires: 5 },
  { month: "Mar", screenings: 24, hires: 7 },
  { month: "Apr", screenings: 21, hires: 6 },
  { month: "May", screenings: 32, hires: 9 },
  { month: "Jun", screenings: 28, hires: 8 },
];

const monthlyCandidates = [
  { month: "Jan", count: 145 },
  { month: "Feb", count: 198 },
  { month: "Mar", count: 256 },
  { month: "Apr", count: 221 },
  { month: "May", count: 312 },
  { month: "Jun", count: 287 },
];

const assessmentStats = [
  { name: "Sent", value: 42 },
  { name: "Delivered", value: 38 },
  { name: "Queued", value: 6 },
  { name: "Failed", value: 2 },
];

export function DashboardCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Hiring activity" subtitle="Screenings vs shortlist advances">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={hiringActivity}>
            <defs>
              <linearGradient id="fillScreenings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0B1E3B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0B1E3B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="screenings" stroke="#0B1E3B" fill="url(#fillScreenings)" />
            <Area type="monotone" dataKey="hires" stroke="#C8202A" fill="#C8202A" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly candidates" subtitle="Resumes screened across all jobs">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyCandidates}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#C8202A" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Assessment statistics" subtitle="Outbound assessment pipeline" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={assessmentStats} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#0B1E3B" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#E5E9F0] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0B1E3B] ${className ?? ""}`}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-[#0B1E3B] dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
