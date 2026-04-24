"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  pageSize?: number;
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  data, columns, searchPlaceholder = "Search...", searchKeys = [],
  filters = [], pageSize = 10, emptyMessage = "No data found.", isLoading = false, onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const filtered = data.filter((row) => {
    const matchSearch = !search || searchKeys.some((k) =>
      String(row[k] ?? "").toLowerCase().includes(search.toLowerCase())
    );
    const matchFilters = Object.entries(activeFilters).every(([k, v]) =>
      !v || String(row[k] ?? "").toUpperCase() === v.toUpperCase()
    );
    return matchSearch && matchFilters;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col gap-[12px]">
      {/* Search + filters */}
      <div className="flex flex-wrap gap-[8px] items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="w-full pl-[36px] pr-[12px] py-[10px] rounded-[8px] border border-[#EAEAEA] bg-white font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]"
          />
        </div>
        {filters.map((f) => (
          <select key={f.key} value={activeFilters[f.key] ?? ""} aria-label={f.label} title={f.label}
            onChange={(e) => { setActiveFilters((p) => ({ ...p, [f.key]: e.target.value })); setPage(1); }}
            className="py-[10px] px-[12px] rounded-[8px] border border-[#EAEAEA] bg-white font-jakarta text-[13px] text-[#333333] focus:outline-none focus:border-[#2E7D32]">
            <option value="">{f.label}: All</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden">
        {isLoading ? (
          <div className="p-[32px] flex items-center justify-center">
            <div className="w-[32px] h-[32px] border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-[32px] text-center">
            <p className="font-jakarta text-[14px] text-[#9B9B9B]">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EAEAEA] bg-[#F7FFF8]">
                  {columns.map((col) => (
                    <th key={col.key} className={cn("px-[16px] py-[12px] text-left font-jakarta text-[12px] font-semibold text-[#9B9B9B] tracking-[-0.04em] whitespace-nowrap", col.className)}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, i) => (
                  <tr key={i}
                    onClick={() => onRowClick?.(row)}
                    className={cn("border-b border-[#EAEAEA] last:border-0 transition-colors",
                      onRowClick ? "cursor-pointer hover:bg-[#F7FFF8]" : ""
                    )}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-[16px] py-[12px]">
                        {col.render ? col.render(row) : (
                          <span className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
                            {String(row[col.key] ?? "—")}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-jakarta text-[12px] text-[#9B9B9B]">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-[6px]">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="w-[32px] h-[32px] rounded-[6px] border border-[#EAEAEA] flex items-center justify-center disabled:opacity-40 hover:bg-[#F7FFF8] transition-colors">
              <ChevronLeft size={16} className="text-[#545454]" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
              return (
                <button key={p} type="button" onClick={() => setPage(p)}
                  className={cn("w-[32px] h-[32px] rounded-[6px] font-jakarta text-[12px] font-semibold transition-colors",
                    page === p ? "bg-[#2E7D32] text-white" : "border border-[#EAEAEA] text-[#545454] hover:bg-[#F7FFF8]"
                  )}>{p}</button>
              );
            })}
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-[32px] h-[32px] rounded-[6px] border border-[#EAEAEA] flex items-center justify-center disabled:opacity-40 hover:bg-[#F7FFF8] transition-colors">
              <ChevronRight size={16} className="text-[#545454]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
