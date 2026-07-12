import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { NewsFeed } from "@/components/news/NewsFeed";
import { DailyBriefingCard, BriefingSkeleton } from "@/components/news/DailyBriefing";
import { NewsletterSignup } from "@/components/news/NewsletterSignup";
import { getLatestDate, readNewsFile, getAllDates, readDailyBriefing } from "@/lib/news";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t("news.title"),
    description: t("news.description"),
  };
}

export default async function NewsPage() {
  const dates = getAllDates();
  const latest = getLatestDate();
  const items = latest ? readNewsFile(latest) : [];
  const briefing = latest ? readDailyBriefing(latest) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">News</h1>
        <p className="text-muted mt-2 text-sm">
          Curated AI, cloud, DevOps, and web development news.
          {latest && <span> Updated: {latest}</span>}
        </p>
      </section>

      {briefing ? <DailyBriefingCard briefing={briefing} /> : <BriefingSkeleton />}

      <NewsFeed items={items} dates={dates} />

      <NewsletterSignup />
    </div>
  );
}
