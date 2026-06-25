"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme/hirelens-theme-provider";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  variant?: "nav" | "icon" | "floating" | "sidebar";
  className?: string;
};

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (!mounted) {
    if (variant === "nav") {
      return (
        <button
          type="button"
          className={cn("nav-btn theme-toggle-btn theme-toggle-btn--nav", className)}
          aria-hidden
          disabled
        >
          <Moon size={15} strokeWidth={2.25} className="opacity-40" />
          <span className="theme-toggle-btn__label">Theme</span>
        </button>
      );
    }
    if (variant === "floating") {
      return (
        <button
          type="button"
          className={cn("theme-toggle-floating", className)}
          aria-hidden
          disabled
        />
      );
    }
    if (variant === "sidebar") {
      return (
        <Button variant="ghost" size="sm" className={cn("w-full justify-start", className)} disabled>
          ◐ Theme
        </Button>
      );
    }
    return (
      <Button variant="ghost" size="icon" className={cn("text-muted-foreground", className)} disabled />
    );
  }

  if (variant === "nav") {
    return (
      <button
        type="button"
        className={cn("nav-btn theme-toggle-btn theme-toggle-btn--nav", className)}
        onClick={toggle}
        aria-label={label}
        title={label}
      >
        {isDark ? <Sun size={15} strokeWidth={2.25} /> : <Moon size={15} strokeWidth={2.25} />}
        <span className="theme-toggle-btn__label">{isDark ? "Light" : "Dark"}</span>
      </button>
    );
  }

  if (variant === "floating") {
    return (
      <button
        type="button"
        className={cn("theme-toggle-floating", className)}
        onClick={toggle}
        aria-label={label}
        title={label}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("w-full justify-start text-sidebar-foreground", className)}
        onClick={toggle}
        aria-label={label}
      >
        {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
        {isDark ? "Light mode" : "Dark mode"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative text-muted-foreground", className)}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
