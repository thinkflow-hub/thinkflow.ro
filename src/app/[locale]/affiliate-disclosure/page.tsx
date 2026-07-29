import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("affiliate.title") };
}

export default async function AffiliateDisclosurePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <div>
      <PageHeader
        title={t("affiliate.title")}
        description={t("affiliate.description")}
        badge={t("affiliate.badge")}
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <section className="mb-8">
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              ThinkFLOW participates in affiliate marketing programs. This means that some of the links on
              our website are affiliate links. If you click on an affiliate link and make a purchase, we
              may earn a commission at no additional cost to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">Our Commitment</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We label every article with one of two tags, visible at the top of the post, so you know
              exactly what you are reading:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-white/60 font-montserrat-regular text-sm">
              <li>
                <strong className="text-white">Verified from production</strong> — based on our own
                infrastructure, our own benchmarks, and work we actually shipped. Numbers in these posts
                are ours.
              </li>
              <li>
                <strong className="text-white">Market analysis</strong> — informed analysis and comparison
                based on public documentation, vendor-published pricing, and available third-party
                benchmarks, not independently re-tested by us. Still honest, still useful, but not a claim
                of hands-on testing.
              </li>
            </ul>
            <p className="mt-3 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Affiliate relationships do not influence which products we recommend or how we label an
              article.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">Programs We Participate In</h2>
            <ul className="list-disc space-y-1 pl-6 text-white/60 font-montserrat-regular text-sm">
              <li>Hetzner Affiliate Program</li>
              <li>DigitalOcean Affiliate Program</li>
              <li>Vultr Affiliate Program</li>
              <li>Cloudflare Affiliate Program</li>
              <li>Vercel Affiliate Program</li>
              <li>Supabase Partner Program</li>
              <li>Qdrant Affiliate Program</li>
              <li>Weaviate Affiliate Program</li>
              <li>ElevenLabs Affiliate Program</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">How We Identify Affiliate Links</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Affiliate links on thinkflow.ro are marked with{" "}
              <code className="text-white/80">rel=&quot;sponsored nofollow&quot;</code> attributes. Some may include UTM parameters
              for tracking purposes. We also place affiliate disclosure notices at the top and bottom of
              any page containing affiliate links.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">Questions?</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              If you have any questions about our affiliate relationships, please contact us at
              contact@thinkflow.ro.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
