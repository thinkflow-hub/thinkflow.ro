import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("terms.title") };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <div>
      <PageHeader
        title={t("terms.title")}
        description={t("terms.description")}
        badge={t("terms.badge")}
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s1.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s1.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s2.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s2.body1")}
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s2.body2")}
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              <strong className="text-white">{t("terms.sections.s2.exceptionLabel")}</strong> {t("terms.sections.s2.exceptionBody")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s3.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s3.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s4.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s4.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s5.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s5.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s6.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s6.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s7.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s7.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s8.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s8.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s9.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s9.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s10.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s10.body1")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("terms.sections.s11.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("terms.sections.s11.contactPrefix")}{" "}
              <Link href="/contact" className="text-[#3b82f6] underline font-montserrat-bold">contact@thinkflow.ro</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
