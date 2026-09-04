import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { localeAlternates } from "@/lib/seo";

// Wrapper server subțire: homepage-ul e integral client-side (HomeClient),
// iar componentele client nu pot exporta metadata — canonicalul și hreflang-ul
// trebuie să vină de aici. Title/description rămân cele din root layout.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale, "") };
}

export default function HomePage() {
  return <HomeClient />;
}
