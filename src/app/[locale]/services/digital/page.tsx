import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";

const SERVICES = [
  { slug: "translation" },
  { slug: "resumeCv" },
  { slug: "dataCleaning" },
  { slug: "pdfProcessing" },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("servicesDigital.metaTitle") };
}

export default async function ServicesDigitalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div>
      <PageHeader title={t("servicesDigital.title")} description={t("servicesDigital.description")} badge={t("servicesDigital.badge")} />

      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 mb-12">
          {SERVICES.map((s) => (
            <div key={s.slug} className="glass-card p-6 noise-overlay">
              <h3 className="font-montserrat-bold">{t(`servicesDigital.items.${s.slug}.name`)}</h3>
              <p className="mt-1 text-sm text-white/50 font-montserrat-regular">{t(`servicesDigital.items.${s.slug}.desc`)}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-6 text-center noise-overlay">
          <p className="text-white/70 font-montserrat-regular">
            {t("servicesDigital.notice")}
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block text-sm text-[#3b82f6] underline font-montserrat-bold"
          >
            {t("servicesDigital.contactCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
