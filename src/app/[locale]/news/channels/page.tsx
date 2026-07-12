import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChannelManager } from "@/components/news/ChannelManager";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: "News Channels", description: "Custom news channels" };
}

export default function ChannelsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">News Channels</h1>
      <p className="text-sm text-muted mb-6">
        Create custom channels to follow specific topics. Saved in your browser.
      </p>
      <ChannelManager />
    </div>
  );
}
