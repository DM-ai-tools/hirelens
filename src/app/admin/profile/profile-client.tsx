"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { updateAdminProfile, changeAdminPassword } from "@/actions/admin.actions";
import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProfileClient({ user }: { user: { name: string; email: string } }) {
  const { update: updateSession } = useSession();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateAdminProfile(new FormData(e.currentTarget));
      await updateSession();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      await changeAdminPassword(new FormData(e.currentTarget));
      toast.success("Password changed");
      e.currentTarget.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <AdminPageHeader title="Profile" description="Manage your admin account and security." />

      <div className="flex items-center gap-4 rounded-xl border border-[#E5E9F0] bg-white p-6 dark:border-white/10 dark:bg-[#0B1E3B]">
        <Avatar className="h-16 w-16 border-2 border-[#C8202A]/30">
          <AvatarFallback className="bg-[#0B1E3B] text-lg font-bold text-white">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs font-semibold text-[#C8202A] mt-1">Administrator</p>
        </div>
      </div>

      <form
        onSubmit={handleProfile}
        className="rounded-xl border border-[#E5E9F0] bg-white p-6 space-y-4 dark:border-white/10 dark:bg-[#0B1E3B]"
      >
        <h3 className="font-semibold">Update profile</h3>
        <div>
          <Label>Display name</Label>
          <Input name="name" defaultValue={user.name} required className="mt-1" />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={user.email} disabled className="mt-1 bg-muted" />
        </div>
        <Button type="submit" disabled={profileLoading} className="bg-[#C8202A] hover:bg-[#E0353D]">
          {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save profile
        </Button>
      </form>

      <form
        onSubmit={handlePassword}
        className="rounded-xl border border-[#E5E9F0] bg-white p-6 space-y-4 dark:border-white/10 dark:bg-[#0B1E3B]"
      >
        <h3 className="font-semibold">Change password</h3>
        <div>
          <Label>Current password</Label>
          <Input name="currentPassword" type="password" required className="mt-1" />
        </div>
        <div>
          <Label>New password</Label>
          <Input name="newPassword" type="password" required minLength={8} className="mt-1" />
        </div>
        <div>
          <Label>Confirm new password</Label>
          <Input name="confirmPassword" type="password" required minLength={8} className="mt-1" />
        </div>
        <Button type="submit" disabled={passwordLoading} variant="outline">
          {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </div>
  );
}
