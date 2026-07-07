import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("about.title") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div>
      <PageHeader
        title={t("about.title")}
        description={t("about.description")}
        badge={t("about.badge")}
      />

      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-montserrat-bold mb-4 uppercase tracking-tight">{t("about.bioHeading")}</h2>
            <p className="text-sm text-white/50 font-montserrat-regular leading-relaxed mb-4">
              {t("about.bio1")}
            </p>
            <p className="text-sm text-white/50 font-montserrat-regular leading-relaxed">
              {t("about.bio2")}
            </p>
          </div>
          <div>
            <h2 className="text-xl font-montserrat-bold mb-4 uppercase tracking-tight">{t("about.expertiseHeading")}</h2>
            <p className="text-sm text-white/50 font-montserrat-regular leading-relaxed mb-4">
              {t("about.expertiseDesc")}
            </p>
            <h2 className="text-xl font-montserrat-bold mb-4 uppercase tracking-tight">{t("about.connectHeading")}</h2>
            <p className="text-sm text-white/50 font-montserrat-regular leading-relaxed">
              Email: <Link href="mailto:thinkflowhub@gmail.com" className="text-[#3b82f6] hover:underline">thinkflowhub@gmail.com</Link>
            </p>
            <p className="text-sm text-white/50 font-montserrat-regular leading-relaxed mt-2">
              Fiverr: <Link href="https://fiverr.com/thinkflow_ro" className="text-[#3b82f6] hover:underline">fiverr.com/thinkflow_ro</Link>
            </p>
            <p className="text-sm text-white/50 font-montserrat-regular leading-relaxed mt-2">
              GitHub: <Link href="https://github.com/thinkflow-hub" className="text-[#3b82f6] hover:underline">github.com/thinkflow-hub</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
