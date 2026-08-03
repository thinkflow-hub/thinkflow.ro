import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import TrackedLink from "@/components/TrackedLink";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("services.title") };
}

const services = [
  { slug: "private-ai-infrastructure" },
  { slug: "web-development" },
  { slug: "technical-consulting" },
  { slug: "cloud-cost-migration-audit" },
  { slug: "seo-geo-content" },
  { slug: "copywriting-b2b" },
  { slug: "python-automation" },
  { slug: "fiverr-automation", external: "https://fiverr.com/thinkflow_ro" },
];

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div>
      <PageHeader
        title={t("services.title")}
        description={t("services.description")}
        badge={t("services.badge")}
      />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.slug} className="glass-card p-6 group hover:border-[#3b82f6]/20 transition-all relative noise-overlay">
              <h2 className="mb-1 text-lg font-montserrat-bold group-hover:text-[#3b82f6] transition-colors">{t(`services.list.${s.slug}.title`)}</h2>
              <p className="mb-3 text-sm text-[#3b82f6] font-montserrat-bold">{t(`services.list.${s.slug}.price`)}</p>
              <p className="mb-4 text-sm text-white/50 font-montserrat-regular">{t(`services.list.${s.slug}.desc`)}</p>
              {"external" in s && s.external ? (
                <TrackedLink
                  href={s.external}
                  external
                  kind="fiverr_click"
                  slug={s.slug}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="text-sm text-[#3b82f6] underline font-montserrat-bold"
                >
                  {t("services.viewOnFiverr")}
                </TrackedLink>
              ) : (
                <Link href={`/services/${s.slug}`} className="text-sm text-[#3b82f6] underline font-montserrat-bold">
                  {t("services.learnMore")}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
