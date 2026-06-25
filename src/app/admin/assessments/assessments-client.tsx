"use client";

import { useState } from "react";
import {
  createAssessmentAction,
  updateAssessment,
  toggleAssessmentActive,
  deleteAssessment,
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
import { Plus, MoreHorizontal, Pencil, Trash2, ExternalLink, FileText, X } from "lucide-react";
import { toast } from "sonner";

type AssessmentFile = {
  id: string;
  fileName: string;
};

type Assessment = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  filePath: string | null;
  roleTag: string | null;
  description: string | null;
  active: boolean;
  files: AssessmentFile[];
};

function fileCount(a: Assessment) {
  if (a.type !== "ATTACHMENT") return 0;
  return a.files.length || (a.filePath ? 1 : 0);
}

export default function AssessmentsClient({ assessments }: { assessments: Assessment[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    try {
      await createAssessmentAction(formData);
      toast.success("Assessment created");
      setAddOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editItem) return;
    setLoading(true);
    try {
      await updateAssessment(editItem.id, formData);
      toast.success("Assessment updated");
      setEditItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <AdminPageHeader
        title="Assessments"
        description="Upload one or more files (any type) or add external links, tagged by role for matching on reports."
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button className="bg-[#C8202A] hover:bg-[#E0353D]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Assessment
                </Button>
              }
            />
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create assessment</DialogTitle>
              </DialogHeader>
              {addOpen && (
                <AssessmentForm key="create-assessment" onSubmit={handleCreate} loading={loading} />
              )}
            </DialogContent>
          </Dialog>
        }
      />

      <AdminDataTable
        data={assessments}
        searchPlaceholder="Search assessments…"
        searchFilter={(row, q) =>
          row.name.toLowerCase().includes(q) || (row.roleTag?.toLowerCase().includes(q) ?? false)
        }
        columns={[
          {
            key: "name",
            header: "Assessment Name",
            cell: (a) => <span className="font-medium">{a.name}</span>,
          },
          { key: "role", header: "Role tag", cell: (a) => a.roleTag || "All roles" },
          {
            key: "type",
            header: "Type",
            cell: (a) => (
              <span className="inline-flex items-center gap-1.5 text-sm">
                {a.type === "LINK" ? (
                  <>
                    <ExternalLink className="h-3.5 w-3.5" /> Link
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5" /> Files ({fileCount(a)})
                  </>
                )}
              </span>
            ),
          },
          {
            key: "delivery",
            header: "Delivery",
            cell: (a) =>
              a.type === "LINK" ? (
                a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#C8202A] hover:underline"
                  >
                    Open link
                  </a>
                ) : (
                  "—"
                )
              ) : fileCount(a) > 0 ? (
                <div className="space-y-1">
                  {(a.files.length ? a.files : [{ id: "legacy", fileName: "Document" }]).map((f) => (
                    <a
                      key={f.id}
                      href={
                        f.id === "legacy"
                          ? `/api/assessments/${a.id}/file`
                          : `/api/assessments/${a.id}/files/${f.id}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-[#C8202A] hover:underline"
                    >
                      {f.fileName}
                    </a>
                  ))}
                </div>
              ) : (
                "—"
              ),
          },
          {
            key: "status",
            header: "Status",
            cell: (a) => (
              <StatusBadge variant={a.active ? "active" : "inactive"}>
                {a.active ? "Active" : "Inactive"}
              </StatusBadge>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            cell: (a) => (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditItem(a)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await toggleAssessmentActive(a.id, !a.active);
                        toast.success(a.active ? "Deactivated" : "Activated");
                      } catch {
                        toast.error("Failed");
                      }
                    }}
                  >
                    {a.active ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={async () => {
                      if (!confirm("Delete this assessment?")) return;
                      try {
                        await deleteAssessment(a.id);
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

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit assessment</DialogTitle>
          </DialogHeader>
          {editItem && (
            <AssessmentForm
              key={editItem.id}
              onSubmit={handleUpdate}
              loading={loading}
              defaultValues={editItem}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssessmentForm({
  onSubmit,
  loading,
  defaultValues,
}: {
  onSubmit: (formData: FormData) => Promise<void>;
  loading: boolean;
  defaultValues?: Assessment;
}) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [type, setType] = useState<"LINK" | "ATTACHMENT">(
    (defaultValues?.type as "LINK" | "ATTACHMENT") ?? "LINK"
  );
  const [url, setUrl] = useState(
    defaultValues?.type === "LINK" ? (defaultValues.url ?? "") : ""
  );
  const [roleTag, setRoleTag] = useState(defaultValues?.roleTag ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [removeFileIds, setRemoveFileIds] = useState<string[]>([]);

  const existingFiles =
    defaultValues?.files.filter((f) => !removeFileIds.includes(f.id)) ?? [];

  function onFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;
    setStagedFiles((prev) => [...prev, ...Array.from(fileList)]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("type", type);
    formData.set("roleTag", roleTag);
    formData.set("description", description);
    formData.set("active", String(defaultValues?.active ?? true));
    if (type === "LINK") formData.set("url", url);
    stagedFiles.forEach((file) => formData.append("files", file));
    removeFileIds.forEach((id) => formData.append("removeFileIds", id));
    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label>Type</Label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "LINK" | "ATTACHMENT")}
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="LINK">External link</option>
          <option value="ATTACHMENT">File upload</option>
        </select>
      </div>

      {type === "LINK" ? (
        <div key="link-field">
          <Label>Assessment URL</Label>
          <Input
            name="url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Candidates receive this link in the assessment email.
          </p>
        </div>
      ) : (
        <div key="file-field" className="space-y-3">
          <div>
            <Label>Assessment files</Label>
            <Input
              type="file"
              multiple
              onChange={(e) => {
                onFilesSelected(e.target.files);
                e.target.value = "";
              }}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Upload one or more files of any type. All files are attached when sent.
            </p>
          </div>

          {existingFiles.length > 0 && (
            <div className="rounded-lg border border-[#E5E9F0] p-3 dark:border-white/10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Current files
              </p>
              <ul className="space-y-2">
                {existingFiles.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{f.fileName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setRemoveFileIds((prev) => [...prev, f.id])}
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stagedFiles.length > 0 && (
            <div className="rounded-lg border border-dashed border-[#E5E9F0] p-3 dark:border-white/10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                New files to upload
              </p>
              <ul className="space-y-2">
                {stagedFiles.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">
                      {file.name}{" "}
                      <span className="text-muted-foreground">({Math.round(file.size / 1024)} KB)</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setStagedFiles((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!defaultValues && stagedFiles.length === 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Add at least one file before creating this assessment.
            </p>
          )}
        </div>
      )}

      <div>
        <Label>Role tag</Label>
        <Input
          name="roleTag"
          value={roleTag}
          onChange={(e) => setRoleTag(e.target.value)}
          placeholder="e.g. Senior React Developer, Engineering"
          className="mt-1"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          rows={2}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-[#C8202A] hover:bg-[#E0353D]">
        {loading ? "Saving…" : defaultValues ? "Save changes" : "Create assessment"}
      </Button>
    </form>
  );
}