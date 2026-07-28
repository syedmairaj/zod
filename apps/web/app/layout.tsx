import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Zod.ai \u2014 Reliability for AI-Generated Code",
    template: "%s \u2014 Zod.ai",
  },
  description:
    "Validate agent-written code against tests, architecture, security policies, contracts, and independent AI review before merge.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Zod.ai",
    title: "Zod.ai \u2014 Reliability for AI-Generated Code",
    description:
      "Validate agent-written code against tests, architecture, security policies, contracts, and independent AI review before merge.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zod.ai \u2014 Reliability for AI-Generated Code",
    description:
      "Validate agent-written code against tests, architecture, security policies, contracts, and independent AI review before merge.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
