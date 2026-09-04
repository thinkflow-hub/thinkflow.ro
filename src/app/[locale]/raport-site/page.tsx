import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import SiteReportForm from "@/components/SiteReportForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("siteReport.title"), description: t("siteReport.description") };
}

export default async function SiteReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const sections = [
    { titleKey: "siteReport.checkTitle", itemsKey: "siteReport.checkItems" },
    { titleKey: "siteReport.getTitle", itemsKey: "siteReport.getItems" },
    { titleKey: "siteReport.notTitle", itemsKey: "siteReport.notItems" },
  ] as const;

  return (
    <div>
      <PageHeader
        title={t("siteReport.title")}
        description={t("siteReport.description")}
        badge={t("siteReport.badge")}
      />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {sections.map(({ titleKey, itemsKey }) => (
              <section key={titleKey} className="glass-card p-8 relative noise-overlay">
                <h2 className="mb-4 text-sm font-montserrat-bold uppercase tracking-[0.2em] text-[#3b82f6]">
                  {t(titleKey)}
                </h2>
                <ul className="space-y-3">
                  {(t.raw(itemsKey) as string[]).map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/60 font-montserrat-regular">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="mt-0.5 shrink-0">
                        <path d="m9 12 2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="glass-card p-8 relative noise-overlay h-fit">
            <SiteReportForm />
          </div>
        </div>
      </div>
    </div>
  );
}
