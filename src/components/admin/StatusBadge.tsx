import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Vendor
  PENDING:      { label: "Pending",      className: "bg-[#FFF3E0] text-[#FF9800]" },
  APPROVED:     { label: "Approved",     className: "bg-[#D8FFDA] text-[#2E7D32]" },
  REJECTED:     { label: "Rejected",     className: "bg-[#FFEBEE] text-[#E53935]" },
  SUSPENDED:    { label: "Suspended",    className: "bg-[#EAEAEA] text-[#545454]" },
  // Dispute
  OPEN:              { label: "Open",               className: "bg-[#FFEBEE] text-[#E53935]" },
  UNDER_REVIEW:      { label: "Under Review",       className: "bg-[#FFF3E0] text-[#FF9800]" },
  VENDOR_RESPONDED:  { label: "With Uni Admin",     className: "bg-[#E3F2FD] text-[#1565C0]" },
  VENDOR_TIMEOUT:    { label: "Vendor Timeout",     className: "bg-[#FFEBEE] text-[#E53935]" },
  ADMIN_TIMEOUT:     { label: "Admin Timeout",      className: "bg-[#F3E5F5] text-[#7B1FA2]" },
  RESOLVED:          { label: "Resolved",           className: "bg-[#D8FFDA] text-[#2E7D32]" },
  CLOSED:            { label: "Closed",             className: "bg-[#EAEAEA] text-[#545454]" },
  ESCALATED:         { label: "Escalated",          className: "bg-[#F3E5F5] text-[#7B1FA2]" },
  // Order
  DELIVERED:    { label: "Delivered",    className: "bg-[#D8FFDA] text-[#2E7D32]" },
  ACCEPTED:     { label: "Accepted",     className: "bg-[#E3F2FD] text-[#1565C0]" },
  FAILED:       { label: "Failed",       className: "bg-[#FFEBEE] text-[#E53935]" },
  CANCELLED:    { label: "Cancelled",    className: "bg-[#EAEAEA] text-[#545454]" },
  // Withdrawal
  SUCCESSFUL:   { label: "Successful",   className: "bg-[#D8FFDA] text-[#2E7D32]" },
  // User
  VERIFIED:     { label: "Verified",     className: "bg-[#D8FFDA] text-[#2E7D32]" },
  UNVERIFIED:   { label: "Unverified",   className: "bg-[#FFF3E0] text-[#FF9800]" },
  ACTIVE:       { label: "Active",       className: "bg-[#D8FFDA] text-[#2E7D32]" },
  INACTIVE:     { label: "Inactive",     className: "bg-[#EAEAEA] text-[#545454]" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status?.toUpperCase()] ?? { label: status, className: "bg-[#EAEAEA] text-[#545454]" };
  return (
    <span className={cn("inline-flex items-center px-[10px] py-[3px] rounded-full font-jakarta text-[11px] font-semibold", config.className, className)}>
      {config.label}
    </span>
  );
}
