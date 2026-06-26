"use client";

import { useRef, useState } from "react";
import {
  createJobDescription,
  updateJobDescription,
  toggleJobDescriptionActive,
  deleteJobDescription,
} from "@/actions/admin.actions";
import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
import { AdminDataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import type { JobDescriptionRecord } from "@/lib/job-description-queries";

const JD_ACCEPT =
  ".pdf,.doc,.docx,.txt,.md,.rtf,.odt,.html,.htm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export default function JobDescriptionsClient({
  jobDescriptions,
}: {
  jobDescriptions: JobDescriptionRecord[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<JobDescriptionRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const blockDialogCloseRef = useRef(false);

  function handleAddOpenChange(open: boolean) {
    if (!open && blockDialogCloseRef.current) return;
    setAddOpen(open);
  }

  function handleEditOpenChange(open: boolean) {
    if (!open && blockDialogCloseRef.current) return;
    if (!open) setEditItem(null);
  }

  async function handleCreate(formData: FormData) {
    setLoading(true);
    try {
      await createJobDescription(formData);
      toast.success("Job description saved");
      setAddOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editItem) return;
    setLoading(true);
    try {
      await updateJobDescription(editItem.id, formData);
      toast.success("Job description updated");
      setEditItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <AdminPageHeader
        title="Job Descriptions"
        description="Upload and manage job descriptions by role. Active JDs appear in the screening dropdown on the landing page."
        action={
          <Dialog open={addOpen} onOpenChange={handleAddOpenChange} disablePointerDismissal modal={false}>
            <DialogTrigger
              render={
                <Button className="bg-[#C8202A] hover:bg-[#E0353D]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Job Description
                </Button>
              }
            />
            <DialogContent className="flex max-h-[90dvh] max-w-lg flex-col gap-0 overflow-hidden p-0">
              <DialogHeader className="shrink-0 border-b border-[#E5E9F0] px-4 pb-3 pt-4 pr-12 dark:border-white/10">
                <DialogTitle>Add job description</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                <JobDescriptionForm
                  onSubmit={handleCreate}
                  loading={loading}
                  blockDialogCloseRef={blockDialogCloseRef}
                />
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <AdminDataTable
        data={jobDescriptions}
        searchPlaceholder="Search job descriptions…"
        searchFilter={(row, q) =>
          row.title.toLowerCase().includes(q) || (row.roleTag?.toLowerCase().includes(q) ?? false)
        }
        columns={[
          {
            key: "title",
            header: "Role / Title",
            cell: (jd) => <span className="font-medium">{jd.title}</span>,
          },
          {
            key: "roleTag",
            header: "Role tag",
            cell: (jd) => jd.roleTag || "—",
          },
          {
            key: "source",
            header: "Source",
            cell: (jd) => (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {jd.fileName ? jd.fileName : "Pasted text"}
              </span>
            ),
          },
          {
            key: "preview",
            header: "JD preview",
            cell: (jd) => (
              <span className="line-clamp-2 max-w-md text-sm text-muted-foreground">
                {jd.jdText.slice(0, 140)}
                {jd.jdText.length > 140 ? "…" : ""}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (jd) => (
              <StatusBadge variant={jd.active ? "active" : "inactive"}>
                {jd.active ? "Active" : "Inactive"}
              </StatusBadge>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            cell: (jd) => (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditItem(jd)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await toggleJobDescriptionActive(jd.id, !jd.active);
                        toast.success(jd.active ? "Deactivated" : "Activated");
                      } catch {
                        toast.error("Failed");
                      }
                    }}
                  >
                    {jd.active ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={async () => {
                      if (!confirm("Delete this job description?")) return;
                      try {
                        await deleteJobDescription(jd.id);
                        toast.success("Deleted");
                      } catch {
                        toast.error("Delete failed");
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <Dialog open={!!editItem} onOpenChange={handleEditOpenChange} disablePointerDismissal modal={false}>
        <DialogContent className="flex max-h-[90dvh] max-w-lg flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-[#E5E9F0] px-4 pb-3 pt-4 pr-12 dark:border-white/10">
            <DialogTitle>Edit job description</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {editItem && (
              <JobDescriptionForm
                key={editItem.id}
                onSubmit={handleUpdate}
                loading={loading}
                defaultValues={editItem}
                blockDialogCloseRef={blockDialogCloseRef}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobDescriptionForm({
  onSubmit,
  loading,
  defaultValues,
  blockDialogCloseRef,
}: {
  onSubmit: (formData: FormData) => Promise<void>;
  loading: boolean;
  defaultValues?: JobDescriptionRecord;
  blockDialogCloseRef?: React.MutableRefObject<boolean>;
}) {
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [roleTag, setRoleTag] = useState(defaultValues?.roleTag ?? "");
  const [jdText, setJdText] = useState(defaultValues?.jdText ?? "");
  const [stagedFileName, setStagedFileName] = useState<string | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (removeFile) formData.set("removeFile", "true");
    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
      <input type="hidden" name="active" value={String(defaultValues?.active ?? true)} />
      <div>
        <Label>Role title</Label>
        <Input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior AI Engineer"
          className="mt-1"
        />
      </div>
      <div>
        <Label>Role tag</Label>
        <Input
          name="roleTag"
          value={roleTag}
          onChange={(e) => setRoleTag(e.target.value)}
          placeholder="e.g. Engineering, AI"
          className="mt-1"
        />
      </div>
      <div>
        <Label>Job description text</Label>
        <Textarea
          name="jdText"
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here, or upload a document below."
          className="mt-1 min-h-[160px]"
          rows={6}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Paste text or upload a document. If both are provided, the uploaded file is used.
        </p>
      </div>
      <div>
        <Label>Upload JD document</Label>
        <input
          ref={fileInputRef}
          type="file"
          name="jdFile"
          accept={JD_ACCEPT}
          className="mt-1 block w-full cursor-pointer rounded-lg border border-input bg-transparent px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#C8202A] file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#E0353D]"
          onMouseDown={() => {
            if (blockDialogCloseRef) blockDialogCloseRef.current = true;
          }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setStagedFileName(file?.name ?? null);
            setRemoveFile(false);
            window.setTimeout(() => {
              if (blockDialogCloseRef) blockDialogCloseRef.current = false;
            }, 400);
          }}
        />
        {defaultValues?.fileName && !removeFile && !stagedFileName && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-[#E5E9F0] px-3 py-2 text-sm dark:border-white/10">
            <span className="inline-flex items-center gap-2 truncate">
              <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
              {defaultValues.fileName}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setRemoveFile(true)}>
              Remove
            </Button>
          </div>
        )}
        {stagedFileName && (
          <p className="mt-1 text-sm text-[#C8202A]">New file selected: {stagedFileName}</p>
        )}
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-[#C8202A] hover:bg-[#E0353D]">
        {loading ? "Saving…" : defaultValues ? "Save changes" : "Save job description"}
      </Button>
    </form>
  );
}
