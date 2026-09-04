import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import TrackedLink from "@/components/TrackedLink";
import { localeAlternates } from "@/lib/seo";

const SLUG_TO_KEY: Record<string, string> = {
  "private-ai-infrastructure": "privateAi",
  "web-development": "webDevelopment",
  "technical-consulting": "technicalConsulting",
  "cloud-cost-migration-audit": "cloudCostMigrationAudit",
  "seo-geo-content": "seoGeoContent",
  "copywriting-b2b": "copywritingB2b",
  "fiverr-automation": "fiverrAutomation",
  "python-automation": "pythonAutomation",
  "website-care": "websiteCare",
  "clipping": "clipping",
  "ai-voice-agent": "aiVoiceAgent",
};

export function generateStaticParams() {
  return Object.keys(SLUG_TO_KEY).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale });
  const key = SLUG_TO_KEY[slug];
  if (!key) return { title: t("services.notFound.title") };
  return {
    title: t(`services.detail.${key}.title`),
    description: t(`services.detail.${key}.desc`),
    alternates: localeAlternates(locale, `/services/${slug}`),
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale });
  const key = SLUG_TO_KEY[slug];

  if (!key) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-montserrat-bold">{t("services.notFound.title")}</h1>
        <p className="mb-8 text-white/60 font-montserrat-regular">{t("services.notFound.description")}</p>
        <Link href="/services" className="text-[#3b82f6] underline font-montserrat-bold">{t("services.viewAll")}</Link>
      </div>
    );
  }

  const title = t(`services.detail.${key}.title`);
  const price = t(`services.detail.${key}.price`);
  const desc = t(`services.detail.${key}.desc`);
  const details = t.raw(`services.detail.${key}.details`) as string[];
  const audiences = t.raw(`services.detail.${key}.audiences`) as string[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/services" className="mb-8 block text-sm text-white/50 hover:text-white font-montserrat-bold tracking-wider uppercase">&larr; {t("services.backToServices")}</Link>

      <div className="glass-card p-8 md:p-12 relative noise-overlay mb-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl md:text-4xl font-montserrat-bold tracking-tighter uppercase">{title}</h1>
          <span className="text-lg text-[#3b82f6] font-montserrat-extrabold ml-4 shrink-0">{price}</span>
        </div>
        <p className="leading-relaxed text-white/60 font-montserrat-regular max-w-2xl">{desc}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass-card p-8 relative noise-overlay">
          <h2 className="mb-4 text-sm font-montserrat-bold uppercase tracking-[0.2em] text-[#3b82f6]">{t("services.detail.whatYouGet")}</h2>
          <ul className="space-y-3">
            {details.map((d, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/60 font-montserrat-regular">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="mt-0.5 shrink-0">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                {d}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card p-8 relative noise-overlay">
          <h2 className="mb-4 text-sm font-montserrat-bold uppercase tracking-[0.2em] text-[#3b82f6]">{t("services.detail.whoThisIsFor")}</h2>
          <ul className="space-y-3">
            {audiences.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/60 font-montserrat-regular">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="mt-0.5 shrink-0">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {a}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 text-center">
        <TrackedLink
          href={`/contact?subject=${encodeURIComponent(title)}`}
          kind="cta_click"
          slug={slug}
          className="glass-button inline-flex items-center gap-2 px-10 py-4 text-white font-montserrat-bold text-sm uppercase tracking-[0.25em]"
        >
          {t("services.detail.inquireCta")}
        </TrackedLink>
      </div>
    </div>
  );
}
