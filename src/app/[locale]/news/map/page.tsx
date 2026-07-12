import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { NewsMap } from "@/components/news/NewsMap";
import { readGeoLocations } from "@/lib/news";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: "News Map", description: "Explore news by location" };
}

export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const locations = readGeoLocations(7);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href={`/${locale}/news`} className="mb-6 inline-block text-sm text-muted hover:text-foreground transition-colors">
        ← Back to News
      </Link>

      <section className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Explore by Location</h1>
        <p className="text-sm text-muted mt-1">Stories pinned to cities around the world</p>
      </section>

      <NewsMap locations={locations} />
    </div>
  );
}
