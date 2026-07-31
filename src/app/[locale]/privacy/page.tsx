import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("privacy.title") };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <div>
      <PageHeader
        title={t("privacy.title")}
        description={t("privacy.description")}
        badge={t("privacy.badge")}
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s1.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s1.body1")}
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s1.body2Prefix")}{" "}
              <Link href="/contact" className="text-[#3b82f6] underline font-montserrat-bold">contact@thinkflow.ro</Link>.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s2.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s2.body1")}
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s2.body2")}
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s3.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s3.body1")}
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s4.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s4.body1")}
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s5.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s5.body1")}
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s5.body2")}
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s6.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s6.body1")}
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s6.body2")}
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s7.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s7.body1")}
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s8.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s8.intro")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-white/60 font-montserrat-regular text-sm">
              <li><strong className="text-white">{t("privacy.sections.s8.right1Label")}</strong> {t("privacy.sections.s8.right1Body")}</li>
              <li><strong className="text-white">{t("privacy.sections.s8.right2Label")}</strong> {t("privacy.sections.s8.right2Body")}</li>
              <li><strong className="text-white">{t("privacy.sections.s8.right3Label")}</strong> {t("privacy.sections.s8.right3Body")}</li>
              <li><strong className="text-white">{t("privacy.sections.s8.right4Label")}</strong> {t("privacy.sections.s8.right4Body")}</li>
              <li><strong className="text-white">{t("privacy.sections.s8.right5Label")}</strong> {t("privacy.sections.s8.right5Body")}</li>
              <li><strong className="text-white">{t("privacy.sections.s8.right6Label")}</strong> {t("privacy.sections.s8.right6Body")}</li>
              <li><strong className="text-white">{t("privacy.sections.s8.right7Label")}</strong> {t("privacy.sections.s8.right7Body")}</li>
            </ul>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s8.closingPrefix")}{" "}
              <Link href="/contact" className="text-[#3b82f6] underline font-montserrat-bold">contact@thinkflow.ro</Link>.
              {" "}{t("privacy.sections.s8.closingSuffix")}
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s9.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s9.body1")}
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Website: <span className="text-white">www.dataprotection.ro</span><br />
              Address: B-dul G-ral. Gheorghe Magheru, nr. 28-30, Sector 1, Bucuresti<br />
              Email: anspdcp@dataprotection.ro
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s10.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s10.body1")}
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s11.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s11.body1")}
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s12.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s12.body1")}
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">{t("privacy.sections.s13.heading")}</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              {t("privacy.sections.s13.contactPrefix")}{" "}
              <Link href="/contact" className="text-[#3b82f6] underline font-montserrat-bold">contact@thinkflow.ro</Link>
              {t("privacy.sections.s13.contactSuffix")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
