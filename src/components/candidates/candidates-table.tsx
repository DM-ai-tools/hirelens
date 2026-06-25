"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, ChevronDown } from "lucide-react";
import type { GoodToCall } from "@prisma/client";

export interface CandidateRow {
  id: string;
  rank: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  overallExperience: number | null;
  relevantExperience: number | null;
  strengths: string[];
  missingSkills: string[];
  matchedSkills: string[];
  score: number | null;
  goodToCall: GoodToCall | null;
  selected: boolean;
  aiRationale?: string | null;
  mustHaveStats?: {
    totalMustHave: number;
    matchedMustHave: number;
    missingMustHave: number;
  };
}

function GoodToCallBadge({ value }: { value: GoodToCall | null }) {
  const map = {
    YES: "bg-[#E8F8EF] text-[#1E9E5A]",
    MAYBE: "bg-[#FFF8E6] text-[#B06E0A]",
    NO: "bg-[#FDECEC] text-[#E24B4A]",
    NEEDS_REVIEW: "bg-[#F0F0F0] text-[#7A8798]",
  };
  const label = { YES: "Yes", MAYBE: "Maybe", NO: "No", NEEDS_REVIEW: "Review" };
  if (!value) return <span>-</span>;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[value]}`}>{label[value]}</span>;
}

export function CandidatesTable({
  data,
  onSelectionChange,
  onRowSelect,
}: {
  data: CandidateRow[];
  onSelectionChange?: (ids: string[]) => void;
  onRowSelect?: (id: string, selected: boolean) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "rank", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const columns = useMemo<ColumnDef<CandidateRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => {
              row.toggleSelected(!!v);
              onRowSelect?.(row.original.id, !!v);
            }}
          />
        ),
      },
      { accessorKey: "rank", header: "#", cell: ({ row }) => row.original.rank ?? "-" },
      { accessorKey: "name", header: "Candidate", cell: ({ row }) => <span className="font-semibold text-[#0B1E3B]">{row.original.name || "-"}</span> },
      { accessorKey: "email", header: "Email", cell: ({ row }) => <span className="text-xs text-[#7A8798]">{row.original.email || "-"}</span> },
      { accessorKey: "phone", header: "Phone", cell: ({ row }) => <span className="text-xs">{row.original.phone || "-"}</span> },
      { accessorKey: "overallExperience", header: "Overall", cell: ({ row }) => row.original.overallExperience != null ? `${row.original.overallExperience}y` : "-" },
      { accessorKey: "relevantExperience", header: "Relevant", cell: ({ row }) => row.original.relevantExperience != null ? `${row.original.relevantExperience}y` : "-" },
      {
        accessorKey: "strengths",
        header: "Strengths",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.matchedSkills.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "missingSkills",
        header: "Gaps",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.missingSkills.slice(0, 2).map((s) => (
              <Badge key={s} variant="outline" className="text-[10px] text-[#E24B4A] border-[#E24B4A]/30">{s}</Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ row }) => {
          const s = row.original.score;
          const color = (s ?? 0) >= 70 ? "text-[#1E9E5A]" : (s ?? 0) >= 55 ? "text-[#B06E0A]" : "text-[#E24B4A]";
          return <span className={`font-bold ${color}`}>{s ?? "-"}</span>;
        },
      },
      {
        accessorKey: "goodToCall",
        header: "Good to Call",
        cell: ({ row }) => <GoodToCallBadge value={row.original.goodToCall} />,
      },
    ],
    [onRowSelect]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      const ids = Object.keys(next).filter((k) => next[k]).map((k) => data[parseInt(k)]?.id).filter(Boolean);
      onSelectionChange?.(ids as string[]);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  function exportCsv() {
    const headers = ["Rank", "Name", "Email", "Score", "Good to Call"];
    const rows = data.map((c) => [c.rank, c.name, c.email, c.score, c.goodToCall]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidates.csv";
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search candidates..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm">Columns <ChevronDown className="ml-1 h-3 w-3" /></Button>} />
          <DropdownMenuContent>
            {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.getIsVisible()}
                onCheckedChange={(v) => col.toggleVisibility(!!v)}
              >
                {col.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-1 h-3 w-3" /> Export
        </Button>
      </div>
      <div className="rounded-xl border border-[#E5E9F0] overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-[#0B1E3B] hover:bg-[#0B1E3B]">
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-white text-xs">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No candidates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} candidates
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
