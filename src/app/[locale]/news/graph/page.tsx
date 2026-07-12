import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { readGraph } from "@/lib/news";
import { NewsGraphClient } from "./NewsGraphClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: "Knowledge Graph", description: "Explore connections between news stories" };
}

export default async function GraphPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const graph = readGraph();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href={`/${locale}/news`} className="mb-6 inline-block text-sm text-muted hover:text-foreground transition-colors">
        ← Back to News
      </Link>

      <section className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
        {graph && (
          <p className="text-sm text-muted mt-1">
            {graph.stats.articles} articles · {graph.stats.entities} topics · {graph.stats.edges} connections
          </p>
        )}
      </section>

      {graph ? (
        <div className="h-[600px] rounded-xl border bg-card">
          <NewsGraphClient graph={graph} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 rounded-xl border bg-card">
          <p className="text-sm text-muted">Knowledge graph not available. Run the pipeline to generate one.</p>
        </div>
      )}

      <div className="mt-4 text-xs text-muted">
        <p>• Colored nodes are articles (color = category)</p>
        <p>• Gray nodes are keywords and topics</p>
        <p>• Hover a node to see details · Click to navigate</p>
      </div>
    </div>
  );
}
