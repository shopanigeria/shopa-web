import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const sizeMap = {
  small: "text-[32px]",
  medium: "text-[40px]",
  large: "text-[52px]",
};

export function Logo({ size = "medium", className }: LogoProps) {
  return (
    <span
      className={cn(
        "font-satoshi font-bold text-secondary leading-none",
        sizeMap[size],
        className
      )}
    >
      Shopa
    </span>
  );
}
