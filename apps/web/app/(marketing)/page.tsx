import { getCurrentUser } from "@/lib/auth";
import { AnnouncementStrip } from "@/components/marketing/announcement-strip";
import { SiteHeader } from "@/components/marketing/site-header";
import { Hero } from "@/components/marketing/hero";
import { WhyAnotherTool } from "@/components/marketing/why-another-tool";
import { ProblemSection } from "@/components/marketing/problem-section";
import { ValidationPipeline } from "@/components/marketing/validation-pipeline";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { EvidenceTabs } from "@/components/marketing/evidence-tabs";
import { WorkflowIntegrations } from "@/components/marketing/workflow-integrations";
import { SecuritySection } from "@/components/marketing/security-section";
import { StatusEarlyAccess } from "@/components/marketing/status-early-access";
import { PricingPreview } from "@/components/marketing/pricing-preview";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { SiteFooter } from "@/components/marketing/site-footer";

export default async function MarketingPage() {
  const user = await getCurrentUser();
  const primaryCtaHref = user ? "/dashboard" : "/sign-in";
  const primaryCtaLabel = user ? "Go to dashboard" : "Connect GitHub";

  return (
    <>
      <AnnouncementStrip />
      <SiteHeader primaryCtaHref={primaryCtaHref} primaryCtaLabel={primaryCtaLabel} />
      <main id="main">
        <Hero primaryCtaHref={primaryCtaHref} primaryCtaLabel={primaryCtaLabel} />
        <WhyAnotherTool />
        <ProblemSection />
        <ValidationPipeline />
        <FeatureBento />
        <EvidenceTabs />
        <WorkflowIntegrations />
        <SecuritySection />
        <StatusEarlyAccess primaryCtaHref={primaryCtaHref} primaryCtaLabel={primaryCtaLabel} />
        <PricingPreview />
        <Faq />
        <FinalCta primaryCtaHref={primaryCtaHref} primaryCtaLabel={primaryCtaLabel} />
      </main>
      <SiteFooter />
    </>
  );
}
