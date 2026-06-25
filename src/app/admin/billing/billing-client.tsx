"use client";

import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
import { GlassCard } from "@/features/admin/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { PlatformMetrics } from "@/features/admin/lib/fetch-platform-metrics";

const PLANS = [
  {
    name: "Starter",
    price: "$299",
    period: "/mo",
    features: ["Up to 5 recruiters", "500 screenings/mo", "Email support"],
  },
  {
    name: "Enterprise",
    price: "$899",
    period: "/mo",
    features: ["Unlimited recruiters", "Unlimited screenings", "Priority support", "AI Analytics", "SSO"],
  },
];

function renewalLabel(): string {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `Renews ${months[end.getUTCMonth()]} ${end.getUTCDate()}, ${end.getUTCFullYear()}`;
}

export function BillingClient({ metrics }: { metrics: PlatformMetrics }) {
  return (
    <div className="mx-auto max-w-[1000px] space-y-8">
      <AdminPageHeader
        title="Billing"
        description="Manage your subscription, usage, and invoices."
      />

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="text-2xl font-bold">{metrics.currentPlan}</p>
            <p className="text-sm text-muted-foreground">{renewalLabel()}</p>
          </div>
          <Badge className="bg-[#E8F8EF] text-[#1E9E5A]">Active</Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Screenings this month</p>
            <p className="text-lg font-semibold">{metrics.screenedThisMonth}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Active recruiters</p>
            <p className="text-lg font-semibold">{metrics.recruiterCount}</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = plan.name === metrics.currentPlan;
          return (
            <GlassCard key={plan.name} className={isCurrent ? "ring-2 ring-[#C8202A]" : undefined}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                {isCurrent && <Badge>Current</Badge>}
              </div>
              <p className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-[#1E9E5A]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant={isCurrent ? "outline" : "default"} disabled>
                {isCurrent ? "Current plan" : "Contact sales to upgrade"}
              </Button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
