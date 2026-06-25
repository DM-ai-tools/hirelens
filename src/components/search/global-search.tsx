"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    jobs: { id: string; title: string }[];
    candidates: { id: string; name: string | null; jobId: string }[];
    recruiters: { id: string; name: string }[];
  }>({ jobs: [], candidates: [], recruiters: [] });
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) setResults(json.data);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <>
      <div className="relative flex-1 max-w-md" onClick={() => setOpen(true)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          readOnly
          placeholder="Search jobs, candidates... (⌘K)"
          className="pl-9 cursor-pointer"
        />
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search..." value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.jobs.length > 0 && (
            <CommandGroup heading="Jobs">
              {results.jobs.map((j) => (
                <CommandItem key={j.id} onSelect={() => { router.push(`/report/${j.id}`); setOpen(false); }}>
                  {j.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.candidates.length > 0 && (
            <CommandGroup heading="Candidates">
              {results.candidates.map((c) => (
                <CommandItem key={c.id} onSelect={() => { router.push(`/dashboard/candidates/${c.id}`); setOpen(false); }}>
                  {c.name || "Unknown"}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.recruiters.length > 0 && (
            <CommandGroup heading="Recruiters">
              {results.recruiters.map((r) => (
                <CommandItem key={r.id} onSelect={() => { router.push("/admin/recruiters"); setOpen(false); }}>
                  {r.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
