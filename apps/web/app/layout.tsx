import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const title = "Zod.ai \u2014 Reliability for AI-Generated Code";
const description =
  "Validate agent-written code against tests, architecture, security policies, contracts, and independent AI review before merge.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Zod.ai",
  title: {
    default: title,
    template: "%s \u2014 Zod.ai",
  },
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Zod.ai",
    title,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** Product UI is intentionally dark graphite; match browser chrome. */
export const viewport: Viewport = {
  themeColor: "#0a0c0f",
  colorScheme: "dark",
};

/**
 * Structured data limited to facts already stated in product docs /
 * IMPLEMENTATION_STATUS — no invented founding date, address, or ratings.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Zod.ai",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description,
  url: siteUrl,
};

export default function RootLayout({
  children,
  auth,
}: {
  children: ReactNode;
  auth: ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        {auth}
      </body>
    </html>
  );
}
