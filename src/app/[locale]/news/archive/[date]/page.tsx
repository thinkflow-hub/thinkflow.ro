import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsFeed } from "@/components/news/NewsFeed";
import { DailyBriefingCard, BriefingSkeleton } from "@/components/news/DailyBriefing";
import { readNewsFile, readDailyBriefing, getAllDates } from "@/lib/news";

export async function generateStaticParams() {
  const dates = getAllDates();
  return dates.map((date) => ({ date }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; date: string }> }): Promise<Metadata> {
  const { date } = await params;
  return { title: `News — ${date}`, description: `News from ${date}` };
}

export default async function NewsArchiveDatePage({ params }: { params: Promise<{ locale: string; date: string }> }) {
  const { date } = await params;
  const items = readNewsFile(date);
  if (items.length === 0 && date.length === 10) notFound();

  const briefing = readDailyBriefing(date);
  const dates = getAllDates();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">News — {date}</h1>
        <p className="text-muted mt-2 text-sm">{items.length} stories</p>
      </section>

      {briefing ? <DailyBriefingCard briefing={briefing} /> : <BriefingSkeleton />}

      <NewsFeed items={items} dates={dates} />
    </div>
  );
}
