import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type MarketingContainerProps = HTMLAttributes<HTMLDivElement>;

/**
 * Shared max-width + horizontal padding wrapper for marketing content, so
 * every section aligns to the same content column instead of each component
 * repeating `mx-auto max-w-content px-4 sm:px-5 md:px-8`.
 */
export function MarketingContainer({ className, children, ...props }: MarketingContainerProps) {
  return (
    <div className={cn("mx-auto max-w-content px-4 sm:px-5 md:px-8", className)} {...props}>
      {children}
    </div>
  );
}
