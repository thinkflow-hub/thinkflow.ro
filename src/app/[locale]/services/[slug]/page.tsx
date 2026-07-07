import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const serviceData: Record<string, { title: string; price: string; desc: string; details: string[]; audiences: string[] }> = {
  "private-ai-infrastructure": {
    title: "Private AI Infrastructure",
    price: "EUR 2,500+",
    desc: "Custom LLM deployment, RAG pipelines, and agent orchestration on private hardware. Complete data sovereignty — no third-party API dependencies.",
    details: [
      "Ollama deployment with 28+ local models, benchmarked and production-tested",
      "RAG pipeline design with Qdrant, Chroma, or Pinecone vector storage",
      "Autonomous agent orchestration using LangGraph and Python",
      "Circuit breaker, retry, and failover patterns for production reliability",
      "Monitoring stack with structured JSON logging and health endpoints",
    ],
    audiences: ["Agencies needing private AI without API costs", "CTOs building sovereign AI infrastructure", "Teams that handle sensitive client data"],
  },
  "web-development": {
    title: "Web Development",
    price: "EUR 1,500+",
    desc: "Next.js, Astro, and React applications built for performance and conversion.",
    details: [
      "Next.js 16 App Router with SSG/ISR for optimal Core Web Vitals",
      "Astro sites for content-heavy projects with zero JS by default",
      "Tailwind CSS v4 with dark mode and responsive design",
      "JSON-LD structured data for AI crawlability (GEO optimization)",
      "Vercel or Cloudflare Pages deployment with edge caching",
      "i18n support (EN/RO/ES multilanguage architecture)",
    ],
    audiences: ["SaaS startups needing a marketing site", "Agencies wanting a showcase website", "Content creators needing a GEO-optimized blog"],
  },
  "technical-consulting": {
    title: "Technical Consulting",
    price: "EUR 2,000/day",
    desc: "Architecture review, code audit, performance optimization, and AI infrastructure planning.",
    details: [
      "Full architecture audit with written recommendations",
      "Code review focused on security, performance, and maintainability",
      "AI infrastructure planning: model selection, hardware sizing, RAG design",
      "Performance optimization: Core Web Vitals, database queries, caching strategy",
      "LLM prompt engineering and system prompt design review",
    ],
    audiences: ["Technical teams preparing for AI integration", "Startups needing architecture review before scaling", "Companies evaluating local vs cloud LLM deployment"],
  },
  "seo-geo-content": {
    title: "SEO & GEO Content",
    price: "EUR 150/article",
    desc: "GEO-optimized affiliate content with original benchmarks. Designed for AI citation, not just Google ranking.",
    details: [
      "GEO keyword discovery from conversational queries (HN, Reddit, StackExchange)",
      "Original benchmarks and named frameworks that AIs cite as sources",
      "Honest pros/cons comparisons — every tool evaluated fairly",
      "Conversational FAQ answering real user questions from ChatGPT/Perplexity",
      "Affiliate link integration with UTM tracking and sponsored markup",
      "Warden QA: regex + LLM validation for GEO compliance",
    ],
    audiences: ["Affiliate marketers targeting AI-savvy readers", "SaaS companies wanting GEO-optimized reviews", "Blog owners building AI-citable authority content"],
  },
  "copywriting-b2b": {
    title: "Copywriting B2B",
    price: "EUR 500/package",
    desc: "Landing pages, email sequences, and Facebook ads. Data-driven copy that converts technical audiences.",
    details: [
      "Landing page copy optimized for B2B technical buyers",
      "Email sequences (welcome, nurture, launch, re-engagement)",
      "Facebook ad variants (5 versions with A/B testing framework)",
      "Strategy brief with positioning, messaging, and audience analysis",
      "Tone: authoritative, technical, honest — no marketing fluff",
    ],
    audiences: ["B2B SaaS companies launching new products", "Agencies needing copy for technical clients", "Startups preparing go-to-market messaging"],
  },
  "fiverr-automation": {
    title: "Fiverr Automation Services",
    price: "EUR 50-500/gig",
    desc: "Listed on Fiverr with 2-5 day delivery. Web scraping, API integrations, browser automation, data cleaning, and custom Python scripts.",
    details: [
      "Fiverr gig listing with 2-5 day delivery window",
      "Web scrapers (Playwright, BeautifulSoup, Scrapy)",
      "API integrations and data synchronization",
      "Browser automation (login flows, form filling, PDF generation)",
      "Data cleaning, transformation, and ETL",
      "Custom CLI tools and workflow scripts",
    ],
    audiences: ["Businesses needing quick automation tasks", "Fiverr buyers wanting custom Python scripts", "Teams needing reliable one-off data work"],
  },
  "python-automation": {
    title: "Python Automation",
    price: "EUR 50-500",
    desc: "Custom Python scripts for web scraping, API integration, data pipelines, and browser automation.",
    details: [
      "Web scrapers with Playwright, BeautifulSoup, Scrapy",
      "API integrations and data synchronization scripts",
      "Data cleaning, transformation, and ETL pipelines",
      "Browser automation with Playwright (login flows, form filling, PDF generation)",
      "Custom CLI tools and productivity scripts",
      "Delivered with documentation and error handling",
    ],
    audiences: ["Businesses needing data extraction from websites", "Teams wanting to automate repetitive tasks", "Developers needing API integration scripts"],
  },
};

export function generateStaticParams() {
  return Object.keys(serviceData).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceData[slug];
  if (!service) return { title: "Service Not Found" };
  return { title: service.title, description: service.desc };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale });
  const service = serviceData[slug];

  if (!service) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-montserrat-bold">Service Not Found</h1>
        <p className="mb-8 text-white/60 font-montserrat-regular">The service you are looking for does not exist.</p>
        <Link href="/services" className="text-[#3b82f6] underline font-montserrat-bold">{t("services.viewAll")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/services" className="mb-8 block text-sm text-white/50 hover:text-white font-montserrat-bold tracking-wider uppercase">&larr; {t("services.backToServices")}</Link>

      <div className="glass-card p-8 md:p-12 relative noise-overlay mb-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl md:text-4xl font-montserrat-bold tracking-tighter uppercase">{service.title}</h1>
          <span className="text-lg text-[#3b82f6] font-montserrat-extrabold ml-4 shrink-0">{service.price}</span>
        </div>
        <p className="leading-relaxed text-white/60 font-montserrat-regular max-w-2xl">{service.desc}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass-card p-8 relative noise-overlay">
          <h2 className="mb-4 text-sm font-montserrat-bold uppercase tracking-[0.2em] text-[#3b82f6]">What You Get</h2>
          <ul className="space-y-3">
            {service.details.map((d, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/60 font-montserrat-regular">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" className="mt-0.5 shrink-0">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                {d}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card p-8 relative noise-overlay">
          <h2 className="mb-4 text-sm font-montserrat-bold uppercase tracking-[0.2em] text-[#3b82f6]">Who This Is For</h2>
          <ul className="space-y-3">
            {service.audiences.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/60 font-montserrat-regular">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" className="mt-0.5 shrink-0">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {a}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/contact"
          className="glass-button inline-flex items-center gap-2 px-10 py-4 text-white font-montserrat-bold text-sm uppercase tracking-[0.25em]"
        >
          Inquire About This Service
        </Link>
      </div>
    </div>
  );
}
