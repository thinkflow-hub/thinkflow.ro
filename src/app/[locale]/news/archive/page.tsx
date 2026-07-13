import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAllDates } from "@/lib/news";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: "News Archive",
    description: "Browse all past news editions.",
  };
}

export default async function NewsArchivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dates = getAllDates();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">News Archive</h1>
      <p className="text-muted mb-8">{dates.length} editions available</p>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {dates.map((date) => (
          <Link
            key={date}
            href={`/${locale}/news/archive/${date}`}
            className="rounded-lg border bg-card px-4 py-3 text-sm font-medium hover:border-primary/40 transition-colors"
          >
            {date}
          </Link>
        ))}
      </div>
    </div>
  );
}

export const revalidate = 3600;
