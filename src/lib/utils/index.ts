import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format Naira currency */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Calculate Shopa service fee (7.5%) */
export function calculateServiceFee(subtotal: number): number {
  return Math.round(subtotal * 0.075);
}

/** Calculate Paystack fee */
export function calculatePaystackFee(amount: number): number {
  const fee = amount * 0.015;
  return fee > 2000 ? 2000 : Math.round(fee);
}

/** Truncate text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

/** Get initials from name */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Format order status for display */
export function formatOrderStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
