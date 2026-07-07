import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Services",
};

const services = [
  {
    slug: "private-ai-infrastructure",
    title: "Private AI Infrastructure",
    price: "EUR 2,500+",
    desc: "Custom LLM deployment, RAG pipelines, agent orchestration on private hardware. Complete data sovereignty with no third-party API dependencies.",
  },
  {
    slug: "web-development",
    title: "Web Development",
    price: "EUR 1,500+",
    desc: "Next.js, Astro, and React applications. Landing pages, documentation sites, full-stack web apps with modern performance standards.",
  },
  {
    slug: "technical-consulting",
    title: "Technical Consulting",
    price: "EUR 2,000/day",
    desc: "Architecture review, code audit, performance optimization, and AI infrastructure planning for technical teams.",
  },
  {
    slug: "seo-geo-content",
    title: "SEO & GEO Content",
    price: "EUR 150/article",
    desc: "GEO-optimized affiliate content with original benchmarks. Designed for AI citation, not just Google ranking.",
  },
  {
    slug: "copywriting-b2b",
    title: "Copywriting B2B",
    price: "EUR 500/package",
    desc: "Landing pages, email sequences, Facebook ads. Data-driven copy that converts technical audiences.",
  },
  {
    slug: "python-automation",
    title: "Python Automation",
    price: "EUR 50-500",
    desc: "Web scrapers, API integrations, data pipelines, browser automation. Custom scripts tailored to your workflow.",
  },
  {
    slug: "fiverr-automation",
    title: "Fiverr Automation Services",
    price: "EUR 50-500/gig",
    desc: "Listed on Fiverr with 2-5 day delivery. Web scraping, API integrations, browser automation, data cleaning, and custom Python scripts.",
    external: "https://fiverr.com/thinkflow_ro",
  },
];

export default function ServicesPage() {
  return (
    <div>
      <PageHeader
        title="Services"
        description="Production-grade solutions for agencies, startups, and technical teams."
        badge="What We Build"
      />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.slug} className="glass-card p-6 group hover:border-[#3b82f6]/20 transition-all relative noise-overlay">
              <h2 className="mb-1 text-lg font-montserrat-bold group-hover:text-[#3b82f6] transition-colors">{s.title}</h2>
              <p className="mb-3 text-sm text-[#3b82f6] font-montserrat-bold">{s.price}</p>
              <p className="mb-4 text-sm text-white/50 font-montserrat-regular">{s.desc}</p>
              {"external" in s ? (
                <a
                  href={s.external}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="text-sm text-[#3b82f6] underline font-montserrat-bold"
                >
                  View on Fiverr &rarr;
                </a>
              ) : (
                <Link href={`/services/${s.slug}`} className="text-sm text-[#3b82f6] underline font-montserrat-bold">
                  Learn more &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
