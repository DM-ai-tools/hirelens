"use client";

import { useState } from "react";
import {
  createRecruiter,
  updateRecruiter,
  toggleRecruiterActive,
  deleteRecruiter,
} from "@/actions/admin.actions";
import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
import { AdminDataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, MoreHorizontal, Pencil, Trash2, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDateUTC } from "@/lib/format-date";

type Recruiter = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
};

export default function RecruitersClient({ recruiters }: { recruiters: Recruiter[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editRecruiter, setEditRecruiter] = useState<Recruiter | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await createRecruiter(new FormData(e.currentTarget));
      toast.success("Recruiter created");
      setAddOpen(false);
      e.currentTarget.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create recruiter");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editRecruiter) return;
    setLoading(true);
    try {
      await updateRecruiter(editRecruiter.id, new FormData(e.currentTarget));
      toast.success("Recruiter updated");
      setEditRecruiter(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <AdminPageHeader
        title="Recruiters"
        description="Manage recruiter accounts, access, and status."
        action={
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button className="bg-[#C8202A] hover:bg-[#E0353D]">
                <Plus className="mr-2 h-4 w-4" />
                Add Recruiter
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add recruiter</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input name="name" required className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" required className="mt-1" />
              </div>
              <div>
                <Label>Password</Label>
                <Input name="password" type="password" required minLength={8} className="mt-1" />
              </div>
              <input type="hidden" name="role" value="RECRUITER" />
              <Button type="submit" disabled={loading} className="w-full bg-[#C8202A] hover:bg-[#E0353D]">
                {loading ? "Creating…" : "Create recruiter"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      <AdminDataTable
        data={recruiters}
        searchPlaceholder="Search recruiters…"
        searchFilter={(row, q) =>
          row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q)
        }
        columns={[
          { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
          { key: "email", header: "Email", cell: (r) => r.email },
          { key: "role", header: "Role", cell: (r) => r.role },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <StatusBadge variant={r.active ? "active" : "inactive"}>
                {r.active ? "Active" : "Disabled"}
              </StatusBadge>
            ),
          },
          {
            key: "created",
            header: "Created",
            cell: (r) => formatDateUTC(r.createdAt),
          },
          {
            key: "actions",
            header: "Actions",
            cell: (r) => (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditRecruiter(r)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await toggleRecruiterActive(r.id, !r.active);
                        toast.success(r.active ? "Recruiter disabled" : "Recruiter enabled");
                      } catch {
                        toast.error("Action failed");
                      }
                    }}
                  >
                    {r.active ? (
                      <><UserX className="mr-2 h-4 w-4" /> Disable</>
                    ) : (
                      <><UserCheck className="mr-2 h-4 w-4" /> Enable</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={async () => {
                      if (!confirm("Delete this recruiter?")) return;
                      try {
                        await deleteRecruiter(r.id);
                        toast.success("Recruiter deleted");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Delete failed");
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

      <Dialog open={!!editRecruiter} onOpenChange={(o) => !o && setEditRecruiter(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit recruiter</DialogTitle>
          </DialogHeader>
          {editRecruiter && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input name="name" defaultValue={editRecruiter.name} required className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={editRecruiter.email} required className="mt-1" />
              </div>
              <div>
                <Label>New password (optional)</Label>
                <Input name="password" type="password" minLength={8} className="mt-1" />
              </div>
              <input type="hidden" name="role" value="RECRUITER" />
              <input type="hidden" name="active" value={String(editRecruiter.active)} />
              <Button type="submit" disabled={loading} className="w-full bg-[#C8202A] hover:bg-[#E0353D]">
                {loading ? "Saving…" : "Save changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
