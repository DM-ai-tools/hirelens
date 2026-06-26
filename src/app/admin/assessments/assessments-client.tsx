"use client";

import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
import { Plus, MoreHorizontal, Pencil, Trash2, ExternalLink, FileText, X, Upload } from "lucide-react";
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
  const [createStagedFiles, setCreateStagedFiles] = useState<File[]>([]);
  const blockDialogCloseRef = useRef(false);

  function handleAddOpenChange(open: boolean) {
    if (!open && blockDialogCloseRef.current) return;
    if (open) setCreateStagedFiles([]);
    setAddOpen(open);
  }

  function handleEditOpenChange(open: boolean) {
    if (!open && blockDialogCloseRef.current) return;
    if (!open) setEditItem(null);
  }

  async function handleCreate(formData: FormData) {
    setLoading(true);
    try {
      await createAssessmentAction(formData);
      toast.success("Assessment created");
      setCreateStagedFiles([]);
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
      await updateAssessment(editItem.id, formData);
      toast.success("Assessment updated");
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
        title="Assessments"
        description="Upload one or more files (any type) or add external links, tagged by role for matching on reports."
        action={
          <Dialog open={addOpen} onOpenChange={handleAddOpenChange} disablePointerDismissal modal={false}>
            <DialogTrigger
              render={
                <Button className="bg-[#C8202A] hover:bg-[#E0353D]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Assessment
                </Button>
              }
            />
            <DialogContent className="flex max-h-[90dvh] max-w-lg flex-col gap-0 overflow-hidden p-0">
              <DialogHeader className="shrink-0 border-b border-[#E5E9F0] px-4 pb-3 pt-4 pr-12 dark:border-white/10">
                <DialogTitle>Create assessment</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                <AssessmentForm
                  onSubmit={handleCreate}
                  loading={loading}
                  blockDialogCloseRef={blockDialogCloseRef}
                  stagedFiles={createStagedFiles}
                  onStagedFilesChange={setCreateStagedFiles}
                />
              </div>
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

      <Dialog open={!!editItem} onOpenChange={handleEditOpenChange} disablePointerDismissal modal={false}>
        <DialogContent className="flex max-h-[90dvh] max-w-lg flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-[#E5E9F0] px-4 pb-3 pt-4 pr-12 dark:border-white/10">
            <DialogTitle>Edit assessment</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {editItem && (
              <AssessmentForm
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

function AssessmentForm({
  onSubmit,
  loading,
  defaultValues,
  blockDialogCloseRef,
  stagedFiles: stagedFilesProp,
  onStagedFilesChange,
}: {
  onSubmit: (formData: FormData) => Promise<void>;
  loading: boolean;
  defaultValues?: Assessment;
  blockDialogCloseRef?: React.MutableRefObject<boolean>;
  stagedFiles?: File[];
  onStagedFilesChange?: React.Dispatch<React.SetStateAction<File[]>>;
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
  const [internalStagedFiles, setInternalStagedFiles] = useState<File[]>([]);
  const [removeFileIds, setRemoveFileIds] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const pickerId = useId();
  const pickerRef = useRef<HTMLInputElement>(null);
  const submitFilesRef = useRef<HTMLInputElement>(null);

  const stagedFiles = stagedFilesProp ?? internalStagedFiles;
  const setStagedFiles = onStagedFilesChange ?? setInternalStagedFiles;

  const existingFiles =
    defaultValues?.files.filter((f) => !removeFileIds.includes(f.id)) ?? [];

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const picked = Array.from(fileList);
    flushSync(() => {
      setStagedFiles((prev) => [...prev, ...picked]);
    });
    toast.success(`Added ${picked.length} file${picked.length === 1 ? "" : "s"}`);
  }

  function armDialogCloseBlock() {
    if (blockDialogCloseRef) blockDialogCloseRef.current = true;
  }

  function disarmDialogCloseBlock() {
    window.setTimeout(() => {
      if (blockDialogCloseRef) blockDialogCloseRef.current = false;
    }, 400);
  }

  function bindPickerRef(element: HTMLInputElement | null) {
    pickerRef.current = element;
    if (!element) return;
    element.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      addFiles(target.files);
      target.value = "";
      disarmDialogCloseBlock();
    };
  }

  function syncFilesToSubmitInput() {
    const input = submitFilesRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    stagedFiles.forEach((file) => dt.items.add(file));
    input.files = dt.files;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (type === "ATTACHMENT") {
      const totalFiles = stagedFiles.length + existingFiles.length;
      if (totalFiles === 0) {
        toast.error("Add at least one assessment file");
        return;
      }
      syncFilesToSubmitInput();
    }

    const formData = new FormData(e.currentTarget);
    if (type === "ATTACHMENT") {
      formData.delete("files");
      stagedFiles.forEach((file) => formData.append("files", file));
    }
    removeFileIds.forEach((id) => formData.append("removeFileIds", id));
    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
      <input type="hidden" name="active" value={String(defaultValues?.active ?? true)} />
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
          <input
            ref={submitFilesRef}
            type="file"
            name="files"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />

          <div>
            <Label htmlFor={pickerId}>Assessment files</Label>
            <input
              id={pickerId}
              ref={bindPickerRef}
              type="file"
              multiple
              onMouseDown={armDialogCloseBlock}
              onClick={armDialogCloseBlock}
              className="mt-1 block w-full cursor-pointer rounded-lg border border-input bg-transparent px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#C8202A] file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#E0353D]"
            />
            {stagedFiles.length > 0 && (
              <p className="mt-1 text-sm font-medium text-[#C8202A]">
                {stagedFiles.length} file{stagedFiles.length === 1 ? "" : "s"} selected
              </p>
            )}
            <div
              className={`mt-2 rounded-lg border border-dashed p-4 text-center transition-colors ${
                dragOver
                  ? "border-[#C8202A] bg-[#FCF6F6]"
                  : "border-[#E5E9F0] dark:border-white/10"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Or drag &amp; drop files here</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Any file type · multiple files supported
              </p>
            </div>
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