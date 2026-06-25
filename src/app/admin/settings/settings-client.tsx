"use client";

import { useState } from "react";
import { updateSettings } from "@/actions/admin.actions";
import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function SettingsClient({
  settings,
}: {
  settings: {
    companyName: string;
    companyLogo: string | null;
    primaryColor: string;
    anthropicApiKey: string | null;
    resendApiKey: string | null;
    defaultAssessmentDays: number;
    contactEmail: string;
    contactPhone: string;
  } | null;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(new FormData(e.currentTarget));
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminPageHeader
        title="Company Settings"
        description="Company branding, API keys, and platform defaults."
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[#E5E9F0] bg-white p-6 shadow-sm space-y-5 dark:border-white/10 dark:bg-[#0B1E3B]"
      >
        <div>
          <Label>Company Name</Label>
          <Input name="companyName" defaultValue={settings?.companyName} required className="mt-1" />
        </div>
        <div>
          <Label>Company Logo URL</Label>
          <Input
            name="companyLogo"
            placeholder="https://..."
            defaultValue={settings?.companyLogo ?? ""}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">Logo URL used in emails and reports.</p>
        </div>
        <div>
          <Label>Primary Color</Label>
          <div className="mt-1 flex gap-2">
            <Input name="primaryColor" defaultValue={settings?.primaryColor || "#C8202A"} />
            <div
              className="h-9 w-9 shrink-0 rounded-lg border"
              style={{ background: settings?.primaryColor || "#C8202A" }}
            />
          </div>
        </div>
        <div>
          <Label>Anthropic API Key</Label>
          <Input
            name="anthropicApiKey"
            type="password"
            placeholder={settings?.anthropicApiKey ? "••••••••••••" : "sk-ant-..."}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional when <code className="text-xs">ANTHROPIC_API_KEY</code> is set in{" "}
            <code className="text-xs">.env</code> — the environment variable takes priority.
          </p>
        </div>
        <div>
          <Label>Resend API Key</Label>
          <Input
            name="resendApiKey"
            type="password"
            placeholder={settings?.resendApiKey ? "••••••••••••" : "re_..."}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Default Assessment Deadline (days)</Label>
          <Input
            name="defaultAssessmentDays"
            type="number"
            min={1}
            max={90}
            defaultValue={settings?.defaultAssessmentDays || 7}
            className="mt-1"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Contact Email</Label>
            <Input name="contactEmail" type="email" defaultValue={settings?.contactEmail} className="mt-1" />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input name="contactPhone" defaultValue={settings?.contactPhone} className="mt-1" />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="bg-[#C8202A] hover:bg-[#E0353D]">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </form>
    </div>
  );
}
