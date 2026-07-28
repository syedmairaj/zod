import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const BASE =
  "appearance-none inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-50";

interface CommonProps {
  className?: string;
  children: React.ReactNode;
}

interface LinkVariantProps
  extends CommonProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> {
  href: string;
}

type ButtonVariantProps = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/** The outlined, lower-emphasis counterpart to PrimaryButton. Same href/button polymorphism. */
export function SecondaryButton(props: LinkVariantProps | ButtonVariantProps) {
  const classes = cn(BASE, FOCUS_RING, props.className);

  if ("href" in props) {
    const { href, children, className: _className, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { children, className: _className, ...rest } = props;
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
