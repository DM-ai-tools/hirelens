"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobSchema } from "@/lib/validations";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createJobAction } from "@/actions/job.actions";
import { toast } from "sonner";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      department: "",
      location: "",
      employmentType: "Full-time",
      minExperience: 0,
      mustHaveSkills: [],
      niceToHaveSkills: [],
      jdText: "",
      scoreThreshold: 70,
    },
  });

  async function onSubmit(data: z.infer<typeof jobSchema>) {
    setLoading(true);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (Array.isArray(v)) fd.append(k, v.join(","));
      else fd.append(k, String(v));
    });
    try {
      const job = await createJobAction(fd);
      toast.success("Job created");
      router.push(`/dashboard/upload?jobId=${job.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Create Job</h1>
      <Card>
        <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div><Label>Job Title *</Label><Input {...form.register("title")} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Department</Label><Input {...form.register("department")} className="mt-1" /></div>
              <div><Label>Location</Label><Input {...form.register("location")} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Employment Type</Label><Input {...form.register("employmentType")} className="mt-1" /></div>
              <div><Label>Min Experience (years)</Label><Input type="number" {...form.register("minExperience", { valueAsNumber: true })} className="mt-1" /></div>
            </div>
            <div>
              <Label>Must Have Skills (comma-separated) *</Label>
              <Input
                placeholder="React, TypeScript, REST"
                onChange={(e) => form.setValue("mustHaveSkills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nice To Have Skills (comma-separated)</Label>
              <Input
                placeholder="AWS, GraphQL"
                onChange={(e) => form.setValue("niceToHaveSkills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Job Description *</Label>
              <Textarea {...form.register("jdText")} rows={8} className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="bg-[#C8202A] hover:bg-[#E0353D]">
              {loading ? "Saving..." : "Save Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
