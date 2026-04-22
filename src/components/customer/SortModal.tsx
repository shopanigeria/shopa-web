"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type SortOption = "newest" | "popular" | "price_asc" | "price_desc" | "oldest";

const uniqueSortOptions: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Best ratings" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price (low to high)" },
  { value: "price_desc", label: "Price (high to low)" },
];

interface SortPopoverProps {
  value: SortOption;
  onChange: (v: SortOption) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export default function SortPopover({ value, onChange, onClose, anchorRef }: SortPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, anchorRef]);

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-2 z-50 w-[200px] rounded-xl border-2 border-[#40a645] bg-white px-4 py-3 shadow-md"
    >
      {uniqueSortOptions.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => {
            onChange(opt.value);
            onClose();
          }}
          className="flex w-full items-center gap-3 py-2"
        >
          {/* Radio circle */}
          <div className="flex h-4 w-4 items-center justify-center rounded-full border border-[#40a645] shrink-0">
            {value === opt.value && (
              <div className="h-2 w-2 rounded-full bg-[#40a645]" />
            )}
          </div>
          <span
            className={cn(
              "text-[15px] text-[#212121]",
              value === opt.value && "font-semibold"
            )}
          >
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}
