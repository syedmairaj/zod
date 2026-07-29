import Link from "next/link";
import { cn } from "@/lib/cn";
import { ZodSymbol } from "./zod-symbol";

interface ZodBrandLinkProps {
  href?: string;
  className?: string;
  /** When false, renders a non-link brand lockup (e.g. footer). */
  asLink?: boolean;
  onClick?: () => void;
}

/**
 * Logo mark + Zod.ai wordmark. Place the mark immediately before the name.
 */
export function ZodBrandLink({ href = "/", className, asLink = true, onClick }: ZodBrandLinkProps) {
  const content = (
    <>
      <ZodSymbol />
      <span className="font-semibold tracking-tight">Zod.ai</span>
    </>
  );

  if (!asLink) {
    return <div className={cn("inline-flex items-center gap-2.5 text-ink", className)}>{content}</div>;
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2.5 text-ink no-underline transition-opacity hover:opacity-90",
        className,
      )}
    >
      {content}
    </Link>
  );
}
