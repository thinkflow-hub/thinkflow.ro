import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { NewsChat } from "@/components/news/NewsChat";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: "Ask the News", description: "Ask questions about the news archive" };
}

export default function ChatPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href={`/news`} className="mb-6 inline-block text-sm text-muted hover:text-foreground transition-colors">
        ← Back to News
      </Link>

      <div className="h-[600px]">
        <NewsChat />
      </div>
    </div>
  );
}
