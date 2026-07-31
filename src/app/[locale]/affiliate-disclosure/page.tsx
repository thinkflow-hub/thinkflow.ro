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
              {t("affiliate.sections.intro")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("affiliate.sections.commitment.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("affiliate.sections.commitment.body1")}
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-white/60 font-montserrat-regular text-sm">
              <li>
                <strong className="text-white">{t("affiliate.sections.commitment.verifiedLabel")}</strong> {t("affiliate.sections.commitment.verifiedBody")}
              </li>
              <li>
                <strong className="text-white">{t("affiliate.sections.commitment.marketLabel")}</strong> {t("affiliate.sections.commitment.marketBody")}
              </li>
            </ul>
            <p className="mt-3 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("affiliate.sections.commitment.body2")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("affiliate.sections.programs.heading")}</h2>
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
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("affiliate.sections.identify.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("affiliate.sections.identify.prefix")}{" "}
              <code className="text-white/80">rel=&quot;sponsored nofollow&quot;</code>{" "}
              {t("affiliate.sections.identify.suffix")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("affiliate.sections.questions.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("affiliate.sections.questions.body1")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
