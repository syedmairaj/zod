import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const BASE =
  "appearance-none inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-[transform,box-shadow] duration-150 ease-out will-change-transform active:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-edge disabled:pointer-events-none disabled:opacity-50";

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

/**
 * The accent CTA button. Renders a `next/link` when given `href` (navigation)
 * or a native `<button>` otherwise (in-page actions), sharing one visual
 * treatment and one visible focus-ring style either way.
 */
export function PrimaryButton(props: LinkVariantProps | ButtonVariantProps) {
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
