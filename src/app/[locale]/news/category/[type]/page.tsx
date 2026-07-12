import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsFeed } from "@/components/news/NewsFeed";
import { readNewsFile, getAllDates, readDailyBriefing } from "@/lib/news";
import type { Category } from "@/lib/news-types";

const VALID_CATEGORIES: Category[] = [
  "trending", "community", "open_source", "releases",
  "ai_labs", "research", "newsletters", "industry",
];

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; type: string }> }): Promise<Metadata> {
  const { type } = await params;
  return { title: `News — ${type}`, description: `News filtered by category: ${type}` };
}

export default async function NewsCategoryPage({ params }: { params: Promise<{ locale: string; type: string }> }) {
  const { type } = await params;
  if (!VALID_CATEGORIES.includes(type as Category)) notFound();

  const dates = getAllDates();
  const allItems = dates.length > 0
    ? dates.slice(0, 3).flatMap((d) => readNewsFile(d))
    : [];

  const briefing = dates[0] ? readDailyBriefing(dates[0]) : null;
  const items = allItems.filter((item) => item.category === type);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight capitalize">{type.replace("_", " ")}</h1>
        <p className="text-muted mt-2 text-sm">{items.length} stories</p>
      </section>

      <NewsFeed items={items} dates={dates} />
    </div>
  );
}
