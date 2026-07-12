import type { Metadata } from "next";
import { NewsFeed } from "@/components/news/NewsFeed";
import { readNewsFile, getAllDates } from "@/lib/news";

// Topic pages are dynamic — cannot pre-generate all topics

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `News — Topic: ${slug}`, description: `News filtered by topic: ${slug}` };
}

export default async function NewsTopicPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const topic = slug.replace(/-/g, " ").toLowerCase();

  const dates = getAllDates();
  const allItems = dates.length > 0
    ? dates.slice(0, 14).flatMap((d) => readNewsFile(d))
    : [];

  const items = allItems.filter((item) => {
    const text = [item.title, item.description, ...(item.keywords || [])]
      .join(" ")
      .toLowerCase();
    return text.includes(topic);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight capitalize">
          Topic: {topic}
        </h1>
        <p className="text-muted mt-2 text-sm">{items.length} stories found</p>
      </section>

      <NewsFeed items={items} dates={dates} />
    </div>
  );
}
