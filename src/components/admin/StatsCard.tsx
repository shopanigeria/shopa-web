import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, iconBg = "bg-[#D8FFDA]", iconColor = "text-[#2E7D32]", trend, className }: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-[12px] border border-[#EAEAEA] p-[20px] shadow-sm", className)}>
      <div className="flex items-start justify-between mb-[12px]">
        <div className={cn("w-[44px] h-[44px] rounded-[10px] flex items-center justify-center shrink-0", iconBg)}>
          <Icon size={22} className={iconColor} />
        </div>
        {trend && (
          <span className={cn("font-jakarta text-[11px] font-semibold px-[8px] py-[2px] rounded-full",
            trend.value >= 0 ? "bg-[#D8FFDA] text-[#2E7D32]" : "bg-[#FFEBEE] text-[#E53935]"
          )}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <p className="font-satoshi font-bold text-[24px] text-[#151515] leading-tight">{value}</p>
      <p className="font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em] mt-[4px]">{label}</p>
    </div>
  );
}
