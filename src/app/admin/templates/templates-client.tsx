"use client";

import { useState } from "react";
import {
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from "@/actions/admin.actions";
import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
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
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

type Template = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  active: boolean;
};

export default function TemplatesClient({ templates }: { templates: Template[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Template | null>(null);
  const [preview, setPreview] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await createEmailTemplate(new FormData(e.currentTarget));
      toast.success("Template created");
      setAddOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editItem) return;
    setLoading(true);
    try {
      await updateEmailTemplate(editItem.id, new FormData(e.currentTarget));
      toast.success("Template updated");
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
        title="Email Templates"
        description="Create and manage assessment invitation templates."
        action={
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button className="bg-[#C8202A] hover:bg-[#E0353D]">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            }
          />
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New email template</DialogTitle></DialogHeader>
            <TemplateForm onSubmit={handleCreate} loading={loading} />
          </DialogContent>
        </Dialog>
        }
      />

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E5E9F0] p-12 text-center text-muted-foreground">
          No templates yet. Create your first assessment email template.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-[#E5E9F0] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0B1E3B]"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Subject: {t.subject}</p>
                </div>
                <StatusBadge variant={t.active ? "active" : "inactive"}>
                  {t.active ? "Active" : "Inactive"}
                </StatusBadge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreview(t)}>
                  <Eye className="mr-1 h-3 w-3" /> Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditItem(t)}>
                  <Pencil className="mr-1 h-3 w-3" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={async () => {
                    if (!confirm("Delete template?")) return;
                    try {
                      await deleteEmailTemplate(t.id);
                      toast.success("Deleted");
                    } catch {
                      toast.error("Delete failed");
                    }
                  }}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit template</DialogTitle></DialogHeader>
          {editItem && <TemplateForm onSubmit={handleUpdate} loading={loading} defaultValues={editItem} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{preview?.name} — Preview</DialogTitle>
          </DialogHeader>
          {preview && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Subject: {preview.subject}</p>
              <div
                className="rounded-lg border bg-white p-4 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateForm({
  onSubmit,
  loading,
  defaultValues,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  defaultValues?: Template;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input name="name" required defaultValue={defaultValues?.name} className="mt-1" />
      </div>
      <div>
        <Label>Subject</Label>
        <Input name="subject" required defaultValue={defaultValues?.subject} className="mt-1" />
      </div>
      <div>
        <Label>Body HTML</Label>
        <Textarea
          name="bodyHtml"
          required
          rows={8}
          defaultValue={defaultValues?.bodyHtml}
          className="mt-1 font-mono text-xs"
          placeholder="<p>Hello {{candidate_name}}...</p>"
        />
      </div>
      <input type="hidden" name="active" value={String(defaultValues?.active ?? true)} />
      <Button type="submit" disabled={loading} className="w-full bg-[#C8202A] hover:bg-[#E0353D]">
        {loading ? "Saving…" : defaultValues ? "Save template" : "Create template"}
      </Button>
    </form>
  );
}
