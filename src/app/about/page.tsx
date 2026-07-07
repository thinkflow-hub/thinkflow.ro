import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        title="About ThinkFLOW"
        description="Built by Daniel Burcea — AI Systems Architect since 2025."
        badge="Who We Are"
      />

      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <section className="glass-card p-8 relative noise-overlay mb-6">
              <h2 className="mb-4 text-lg font-montserrat-bold uppercase tracking-wide">Philosophy</h2>
              <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
                Data sovereignty is non-negotiable. Every system we build runs on private infrastructure.
                Your code, your data, and your intellectual property remain yours. We do not build generic
                chatbots — we build autonomous systems that execute complex workflows under your control.
              </p>
            </section>

            <section className="glass-card p-8 relative noise-overlay">
              <h2 className="mb-4 text-lg font-montserrat-bold uppercase tracking-wide">Hardware</h2>
              <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
                Intel i5-13600KF, 64GB DDR5, RTX 3060 12GB — capable of running 28+ LLM models locally.
                This is the reference architecture for all ThinkFLOW deployments.
              </p>
            </section>
          </div>

          <div>
            <section className="glass-card p-8 relative noise-overlay mb-6">
              <h2 className="mb-4 text-lg font-montserrat-bold uppercase tracking-wide">Tech Stack</h2>
              <div className="space-y-3">
                {[
                  { tech: "Python / LangGraph / LangChain", desc: "Agent orchestration" },
                  { tech: "Ollama + 28+ Local LLMs", desc: "Private model deployment (qwen2.5-7b champion)" },
                  { tech: "Next.js / Astro / React", desc: "Web delivery" },
                  { tech: "Docker / Vercel / Cloudflare", desc: "Infrastructure" },
                  { tech: "Qdrant / Chroma / Pinecone", desc: "Vector storage" },
                ].map((item) => (
                  <div key={item.tech} className="border-b border-white/5 pb-2 last:border-0">
                    <div className="text-sm font-montserrat-bold text-white">{item.tech}</div>
                    <div className="text-xs text-white/40 font-montserrat-regular">{item.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card p-8 relative noise-overlay">
              <h2 className="mb-4 text-lg font-montserrat-bold uppercase tracking-wide">Services</h2>
              <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm mb-4">
                Explore our full range of services or contact us to discuss your project.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/services"
                  className="glass-button inline-flex items-center gap-2 px-6 py-3 text-white font-montserrat-bold text-xs uppercase tracking-[0.2em]"
                >
                  View Services
                </Link>
                <Link
                  href="/contact"
                  className="glass-button-outline inline-flex items-center gap-2 px-6 py-3 text-[#3b82f6] font-montserrat-bold text-xs uppercase tracking-[0.2em]"
                >
                  Contact Us
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
