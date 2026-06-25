"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  TIMEZONE_OPTIONS,
  deadlineFromParts,
  defaultDeadlineParts,
  formatDeadlineDisplay,
} from "@/lib/assessment-email-templates";
import { Calendar, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export type AssessmentDeadlineValue = {
  date: string;
  time: string;
  timezone: string;
};

const PRESETS = [
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
] as const;

type AssessmentDeadlinePickerProps = {
  value: AssessmentDeadlineValue;
  onChange: (value: AssessmentDeadlineValue) => void;
  variant?: "report" | "modal" | "modal-strip";
  className?: string;
};

export function AssessmentDeadlinePicker({
  value,
  onChange,
  variant = "modal",
  className,
}: AssessmentDeadlinePickerProps) {
  const formattedDeadline = useMemo(() => {
    if (!value.date || !value.time) return "";
    const deadline = deadlineFromParts(value.date, value.time, value.timezone);
    return formatDeadlineDisplay(deadline, value.timezone);
  }, [value.date, value.time, value.timezone]);

  function applyPreset(days: number) {
    const next = defaultDeadlineParts(days, value.timezone);
    onChange({ date: next.date, time: next.time, timezone: value.timezone });
  }

  if (variant === "modal-strip") {
    return (
      <div className={cn("send-modal-deadline", className)}>
        <div className="send-modal-deadline__title">
          <Calendar className="h-4 w-4 shrink-0 text-[#C8202A]" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[#0B1E3B] dark:text-white">Assessment deadline</p>
            {formattedDeadline && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-[#0B1E3B] dark:text-white">Due:</span> {formattedDeadline}
              </p>
            )}
          </div>
        </div>

        <div className="send-modal-deadline__presets">
          {PRESETS.map((preset) => (
            <Button
              key={preset.days}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
              onClick={() => applyPreset(preset.days)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="send-modal-deadline__fields">
          <label className="send-modal-deadline__field">
            <span>Date</span>
            <Input
              type="date"
              value={value.date}
              onChange={(e) => onChange({ ...value, date: e.target.value })}
              className="h-9"
            />
          </label>
          <label className="send-modal-deadline__field">
            <span>Time</span>
            <Input
              type="time"
              value={value.time}
              onChange={(e) => onChange({ ...value, time: e.target.value })}
              className="h-9"
            />
          </label>
          <label className="send-modal-deadline__field send-modal-deadline__field--tz">
            <span>Timezone</span>
            <select
              value={value.timezone}
              onChange={(e) => onChange({ ...value, timezone: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  }

  if (variant === "report") {
    return (
      <div className={cn("send-deadline-block", className)}>
        <div className="send-deadline-block__head">
          <Calendar className="h-4 w-4 text-[#C8202A]" aria-hidden />
          <span>Assessment deadline</span>
        </div>
        <p className="send-deadline-block__hint">Choose when candidates must complete the assessment.</p>

        <div className="send-deadline-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.days}
              type="button"
              className="send-deadline-preset"
              onClick={() => applyPreset(preset.days)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="send-deadline-fields">
          <label className="send-deadline-field">
            <span>Date</span>
            <input
              type="date"
              value={value.date}
              onChange={(e) => onChange({ ...value, date: e.target.value })}
            />
          </label>
          <label className="send-deadline-field">
            <span>Time</span>
            <input
              type="time"
              value={value.time}
              onChange={(e) => onChange({ ...value, time: e.target.value })}
            />
          </label>
          <label className="send-deadline-field send-deadline-field--wide">
            <span>Timezone</span>
            <select
              value={value.timezone}
              onChange={(e) => onChange({ ...value, timezone: e.target.value })}
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {formattedDeadline && (
          <p className="send-deadline-summary">
            <strong>Due:</strong> {formattedDeadline}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <Label className="text-sm font-semibold">Assessment deadline</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Set when candidates must complete the assessment.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.days}
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => applyPreset(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Deadline date
          </Label>
          <Input
            type="date"
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Time
          </Label>
          <Input
            type="time"
            value={value.time}
            onChange={(e) => onChange({ ...value, time: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="flex items-center gap-1">
          <Globe className="h-3.5 w-3.5" /> Timezone
        </Label>
        <select
          value={value.timezone}
          onChange={(e) => onChange({ ...value, timezone: e.target.value })}
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {formattedDeadline && (
        <div className="rounded-lg border border-[#E5E9F0] bg-[#F6F8FB] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Candidates must complete by
          </p>
          <p className="mt-1 text-sm font-medium text-[#0B1E3B] dark:text-white">{formattedDeadline}</p>
        </div>
      )}
    </div>
  );
}
