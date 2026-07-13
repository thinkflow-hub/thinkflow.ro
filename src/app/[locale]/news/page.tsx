import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { NewsFeed } from "@/components/news/NewsFeed";
import { DailyBriefingCard, BriefingSkeleton } from "@/components/news/DailyBriefing";
import { NewsletterSignup } from "@/components/news/NewsletterSignup";
import { getLatestDate, readNewsFile, getAllDates, readDailyBriefing, readGraph } from "@/lib/news";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t("news.title"),
    description: t("news.description"),
  };
}

export default async function NewsPage({ params }: { params?: Promise<{ locale: string }> }) {
  const locale = (await params)?.locale || "en";
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
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/${locale}/news/channels`}
            className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors"
          >
            📡 My Channels
          </Link>
          <Link
            href={`/${locale}/news/graph`}
            className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors"
          >
            🕸️ Knowledge Graph
          </Link>
          <Link
            href={`/${locale}/news/chat`}
            className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors"
          >
            💬 Ask AI
          </Link>
        </div>
      </section>

      {briefing ? <DailyBriefingCard briefing={briefing} /> : <BriefingSkeleton />}

      <NewsFeed items={items} dates={dates} />

      <NewsletterSignup />
    </div>
  );
}

export const revalidate = 3600;  // ISR: revalidate every hour
