import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Media Kit",
};

export default function MediaKitPage() {
  return (
    <div>
      <PageHeader
        title="Media Kit"
        description="For brands, partners, and affiliate networks."
        badge="Partner Resources"
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">About ThinkFLOW</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              ThinkFLOW provides private AI infrastructure, web development, and technical consulting for
              agencies and businesses that demand data sovereignty and production-grade reliability. We build
              autonomous systems using Python, LangGraph, Docker, and local LLM infrastructure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">Content Categories</h2>
            <ul className="list-disc space-y-1 pl-6 text-white/60 font-montserrat-regular text-sm">
              <li><span className="text-white font-montserrat-bold">Cloud &amp; Hosting Infrastructure</span> — Vercel, Cloudflare, AWS, deployment</li>
              <li><span className="text-white font-montserrat-bold">AI &amp; LLM Engineering</span> — RAG pipelines, Ollama, vector databases, agent orchestration</li>
              <li><span className="text-white font-montserrat-bold">DevOps &amp; Automation</span> — Docker, CI/CD, monitoring, browser automation</li>
              <li><span className="text-white font-montserrat-bold">Web Development</span> — Next.js, Astro, performance optimization, SEO</li>
              <li><span className="text-white font-montserrat-bold">Technical Comparisons</span> — GEO-optimized, benchmark-driven, honest pros/cons</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">Audience</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Our audience consists of technical founders, CTOs, lead developers, and agency owners who
              make infrastructure and tooling decisions. Readers are engineering-focused, value benchmarks
              and real data, and prefer depth over breadth.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">By the Numbers</h2>
            <ul className="list-disc space-y-1 pl-6 text-white/60 font-montserrat-regular text-sm">
              <li>1,200+ operations processed on private infrastructure</li>
              <li>28+ local LLM models benchmarked and deployed</li>
              <li>3.2x average scaling speed improvement</li>
              <li>100% data sovereignty (no third-party API dependencies)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="mb-3 text-xl font-montserrat-bold">Partner With Us</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Interested in a product review, sponsored content, or affiliate partnership? Contact us at
              thinkflowhub@gmail.com with your brand name, product category, and partnership proposal.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
