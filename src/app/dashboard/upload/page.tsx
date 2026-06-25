"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Upload, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadResumesAction } from "@/actions/job.actions";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

function UploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get("jobId");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".pdf") || f.name.endsWith(".docx")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  async function handleUpload() {
    if (!jobId) { toast.error("Select a job first"); return; }
    if (!files.length) { toast.error("Add resume files"); return; }
    setLoading(true);
    setProgress(30);
    const fd = new FormData();
    files.forEach((f) => fd.append("resumes", f));
    try {
      setProgress(60);
      await uploadResumesAction(jobId, fd);
      setProgress(100);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Upload Resumes</h1>
      {!jobId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-sm">
            No job selected. <a href="/dashboard/jobs/new" className="text-[#C8202A] underline">Create a job first</a>.
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Drop resumes for screening</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="cursor-pointer rounded-xl border-2 border-dashed border-[#c9b3b4] bg-[#FCF6F6] p-10 text-center"
            onClick={() => document.getElementById("upload-input")?.click()}
          >
            <Upload className="mx-auto mb-3 h-8 w-8 text-[#7A8798]" />
            <p className="font-semibold">Drag & drop resumes</p>
            <p className="text-sm text-muted-foreground">PDF / DOCX — multiple files supported</p>
            <input
              id="upload-input"
              type="file"
              multiple
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>{files.length} files selected</Label>
              <div className="flex flex-wrap gap-2">
                {files.map((f) => (
                  <span key={f.name} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                    <FileText className="h-3 w-3" /> {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {loading && <Progress value={progress} />}
          <Button
            onClick={handleUpload}
            disabled={loading || !jobId || !files.length}
            className="w-full bg-[#C8202A] hover:bg-[#E0353D]"
          >
            {loading ? "Uploading & Screening..." : "Upload & Start Screening"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadContent />
    </Suspense>
  );
}
