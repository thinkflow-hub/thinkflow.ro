import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("mediaKit.title") };
}

export default async function MediaKitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <div>
      <PageHeader
        title={t("mediaKit.title")}
        description={t("mediaKit.description")}
        badge={t("mediaKit.badge")}
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("mediaKit.sections.about.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("mediaKit.sections.about.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("mediaKit.sections.categories.heading")}</h2>
            <ul className="list-disc space-y-1 pl-6 text-white/60 font-montserrat-regular text-sm">
              <li><span className="text-white font-montserrat-bold">{t("mediaKit.sections.categories.item1Label")}</span> {t("mediaKit.sections.categories.item1Desc")}</li>
              <li><span className="text-white font-montserrat-bold">{t("mediaKit.sections.categories.item2Label")}</span> {t("mediaKit.sections.categories.item2Desc")}</li>
              <li><span className="text-white font-montserrat-bold">{t("mediaKit.sections.categories.item3Label")}</span> {t("mediaKit.sections.categories.item3Desc")}</li>
              <li><span className="text-white font-montserrat-bold">{t("mediaKit.sections.categories.item4Label")}</span> {t("mediaKit.sections.categories.item4Desc")}</li>
              <li><span className="text-white font-montserrat-bold">{t("mediaKit.sections.categories.item5Label")}</span> {t("mediaKit.sections.categories.item5Desc")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("mediaKit.sections.audience.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("mediaKit.sections.audience.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("mediaKit.sections.numbers.heading")}</h2>
            <ul className="list-disc space-y-1 pl-6 text-white/60 font-montserrat-regular text-sm">
              <li>{t("mediaKit.sections.numbers.item1")}</li>
              <li>{t("mediaKit.sections.numbers.item2")}</li>
              <li>{t("mediaKit.sections.numbers.item3")}</li>
              <li>{t("mediaKit.sections.numbers.item4")}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("mediaKit.sections.partner.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("mediaKit.sections.partner.body1")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
