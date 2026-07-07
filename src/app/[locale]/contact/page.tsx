import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/components/ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("contact.title") };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div>
      <PageHeader
        title={t("contact.title")}
        description={t("contact.description")}
        badge={t("contact.badge")}
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
