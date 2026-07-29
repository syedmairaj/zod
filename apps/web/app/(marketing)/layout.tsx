import { SkipToContent } from "@/components/marketing/skip-to-content";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-root min-h-screen bg-bg font-sans text-ink antialiased">
      <SkipToContent />
      {children}
    </div>
  );
}
