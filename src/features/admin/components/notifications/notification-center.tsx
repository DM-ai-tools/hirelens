"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/features/admin/types";

const typeStyles = {
  error: "border-l-[#C8202A] bg-[#FBE9EA]/50",
  warning: "border-l-[#E0A106] bg-[#FFF8E6]/50",
  info: "border-l-[#0B1E3B] bg-[#F6F8FB]",
  success: "border-l-[#1E9E5A] bg-[#E8F8EF]/50",
};

export function NotificationCenter({
  open,
  onOpenChange,
  notifications,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: NotificationItem[];
}) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Notifications
            {unread > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unread}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="mt-6 h-[calc(100vh-8rem)] pr-4">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-xl border border-[#E5E9F0] border-l-4 p-4 dark:border-white/10",
                    typeStyles[n.type],
                    !n.read && "ring-1 ring-[#C8202A]/20"
                  )}
                >
                  <p className="text-sm font-semibold text-[#0B1E3B] dark:text-white">{n.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Button variant="outline" className="mt-4 w-full" disabled={notifications.length === 0}>
          Mark all as read
        </Button>
      </SheetContent>
    </Sheet>
  );
}
