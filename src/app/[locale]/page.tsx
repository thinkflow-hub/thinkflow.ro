"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";

const services = [
  {
    title: "Private AI Infrastructure",
    price: "EUR 2,500+",
    desc: "Custom LLM deployment, RAG pipelines, agent orchestration on private hardware. Complete data sovereignty.",
    href: "/services/private-ai-infrastructure",
  },
  {
    title: "Web Development",
    price: "EUR 1,500+",
    desc: "Next.js, Astro, React applications. Landing pages, documentation, full-stack web apps.",
    href: "/services/web-development",
  },
  {
    title: "Technical Consulting",
    price: "EUR 2,000/day",
    desc: "Architecture review, code audit, performance optimization, AI infrastructure planning.",
    href: "/services/technical-consulting",
  },
  {
    title: "SEO & GEO Content",
    price: "EUR 150/article",
    desc: "GEO-optimized affiliate content with original benchmarks. AI-citable, not just Google-ranked.",
    href: "/services/seo-geo-content",
  },
  {
    title: "Copywriting B2B",
    price: "EUR 500/package",
    desc: "Landing pages, email sequences, Facebook ads. Data-driven copy for technical audiences.",
    href: "/services/copywriting-b2b",
  },
  {
    title: "Python Automation",
    price: "EUR 50-500",
    desc: "Web scrapers, API integrations, data pipelines, browser automation.",
    href: "/services/python-automation",
  },
  {
    title: "Fiverr Automation",
    price: "EUR 50-500/gig",
    desc: "Listed on Fiverr with 2-5 day delivery. Web scraping, API integrations, browser automation.",
    href: "https://fiverr.com/thinkflow_ro",
    external: true,
  },
];

const archNodes = [
  { label: "Router", desc: "Neural gateway that classifies intent and routes ingestion flows" },
  { label: "Analyzer", desc: "Vector agent that extracts meaning from raw data" },
  { label: "Strategist", desc: "Cognitive layer that plans optimal execution paths" },
  { label: "Writer", desc: "Execution core that generates structured output" },
  { label: "Memory", desc: "Persistent vector storage for continuous learning" },
  { label: "Reviewer", desc: "Safety protocol — real-time self-audit and validation" },
];

function ScrollSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [ref, visible] = useScrollReveal(0.1);
  return (
    <div ref={ref} className={`scroll-reveal ${visible ? "revealed" : ""} ${className}`}>
      {children}
    </div>
  );
}

function ShimmerButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="glass-button shimmer-btn inline-flex items-center gap-2 px-16 py-5 text-white font-montserrat-bold text-xs uppercase tracking-[0.3em] drop-shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all"
    >
      {children}
    </Link>
  );
}

function OutlineButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="glass-button-outline inline-flex items-center gap-2 px-16 py-5 text-[#3b82f6] font-montserrat-bold text-xs uppercase tracking-[0.3em] transition-all border border-[#3b82f6]/20 hover:bg-[#3b82f6]/10 hover:text-white hover:border-[#3b82f6]/40"
    >
      {children}
    </Link>
  );
}

function StatCard({ value, suffix, prefix, label, decimals, start }: {
  value: number; suffix?: string; prefix?: string; label: string; decimals?: number; start: boolean;
}) {
  const count = useCountUp(value, 2000, start);
  return (
    <div className="text-center group">
      <div className="stat-number text-4xl font-bold text-white mb-2 group-hover:text-[#3b82f6] transition-colors">
        {prefix || ""}
        {decimals ? (count / 10).toFixed(decimals) : count}
        {suffix || ""}
      </div>
      <div className="text-[10px] font-montserrat-bold uppercase tracking-[0.3em] text-white/20 group-hover:text-white/40 transition-colors">
        {label}
      </div>
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations();
  const [heroRef, heroVisible] = useScrollReveal(0.01);
  const [servicesRef, servicesVisible] = useScrollReveal(0.1);
  const [pipelineRef, pipelineVisible] = useScrollReveal(0.1);
  const [statsRef, statsVisible] = useScrollReveal(0.3);

  const stats = [
    { value: 1248, suffix: "+", label: t("home.statsOps") },
    { value: 4, prefix: "2-", suffix: " weeks", label: t("home.statsDelivery") },
    { value: 3.2, suffix: "x", label: t("home.statsSpeed"), decimals: 1 },
    { value: 100, suffix: "%", label: t("home.statsSovereignty") },
  ];

  return (
    <div className="bg-black selection:bg-[#3b82f6]/30 selection:text-[#60a5fa]">
      {/* ── Fixed Mesh Background ── */}
      <div className="mesh-bg" />

      {/* ──────────── HERO ──────────── */}
      <section
        ref={heroRef}
        className="snap-section relative z-10 pt-28 sm:pt-36 text-center px-6 sm:px-12"
      >
        <div className="absolute w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 bg-[radial-gradient(circle,#3b82f6,transparent_70%)] blur-[160px] animate-pulse pointer-events-none" />
        <div className="max-w-7xl w-full flex flex-col items-center">
          <div className={`text-4xl md:text-6xl lg:text-[85px] font-montserrat-bold tracking-tighter leading-[0.85] mb-12 uppercase flex flex-col items-center ${heroVisible ? "animate-fade-in-up" : "opacity-0"}`}>
            {t("home.heroTitle").split("\n").map((line, li) => (
              <div key={li} className="flex flex-wrap justify-center gap-x-[0.3em] py-2">
                {line.split(" ").map((word, wi) => (
                  <span
                    key={wi}
                    className={`inline-block whitespace-nowrap pb-4 ${
                      li === 1
                        ? "bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#3b82f6] bg-clip-text text-transparent font-montserrat-extrabold"
                        : "text-white"
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className={`max-w-2xl mx-auto mb-[54px] ${heroVisible ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.2s" }}>
            <p className="text-base md:text-xl text-white/50 font-montserrat-bold uppercase tracking-widest leading-[1.6]">
              {t("home.heroSubtitle")}
            </p>
          </div>
          <div className={`flex flex-col sm:flex-row gap-6 justify-center ${heroVisible ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.3s" }}>
            <ShimmerButton href="/contact">{t("home.cta")}</ShimmerButton>
            <OutlineButton href="#architecture">{t("home.ctaAlt")}</OutlineButton>
          </div>
          <div className="mt-16 w-full max-w-5xl" />
        </div>
      </section>

      {/* ──────────── THE CORE MATERIAL ──────────── */}
      <section className="snap-section relative z-10 px-6 lg:px-16">
        <ScrollSection>
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-4">
                <h2 className="text-4xl md:text-5xl font-montserrat-bold tracking-tighter mb-4 leading-none uppercase">
                  {t("home.coreMaterial")}
                </h2>
                <p className="text-sm text-white/40 font-montserrat-bold uppercase tracking-widest leading-loose">
                  {t("home.coreSubtitle")}
                </p>
              </div>
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
                {[
                  {
                    icon: "shield-check",
                    key: "sovereignty"
                  },
                  {
                    icon: "cpu",
                    key: "intellect"
                  },
                  {
                    icon: "database",
                    key: "memory"
                  },
                ].map((item, i) => (
                  <div key={i} className="glass-card p-6 group hover:border-[#3b82f6]/20 transition-all flex items-start gap-5 relative noise-overlay">
                    <div className="mt-1 flex-shrink-0 relative">
                      <div className="absolute inset-0 bg-[#3b82f6]/30 blur-md rounded-full scale-125" />
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="relative z-10 group-hover:scale-110 transition-all drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
                        {item.icon === "shield-check" ? (
                          <>
                            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                            <path d="m9 12 2 2 4-4" />
                          </>
                        ) : item.icon === "cpu" ? (
                          <>
                            <path d="M12 20v2M12 2v2M17 20v2M17 2v2M2 12h2M2 17h2M2 7h2M20 12h2M20 17h2M20 7h2M7 20v2M7 2v2" />
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                            <rect x="8" y="8" width="8" height="8" rx="1" />
                          </>
                        ) : (
                          <>
                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                            <path d="M3 5V19A9 3 0 0 0 21 19V5" />
                            <path d="M3 12A9 3 0 0 0 21 12" />
                          </>
                        )}
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[13px] font-montserrat-bold mb-2 uppercase tracking-[0.05em]">
                        {t(`home.${item.key}`)}
                      </h3>
                      <p className="text-[13px] text-white/50 leading-snug font-montserrat-bold">
                        {t(`home.${item.key}Desc`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* ──────────── NEURAL INTELLIGENCE ──────────── */}
      <section id="architecture" className="snap-section relative z-10 px-6 lg:px-16">
        <ScrollSection>
          <div className="max-w-5xl mx-auto w-full text-center">
            <div className="glass-card p-4 md:p-10 relative noise-overlay">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse shadow-lg shadow-[#3b82f6]/50" />
                <h2 className="text-2xl sm:text-3xl font-montserrat-bold tracking-tighter uppercase">
                  {t("home.neuralIntelligence")}
                </h2>
              </div>
              <p className="text-[10px] sm:text-xs font-montserrat-bold text-white/20 uppercase tracking-[0.4em] mb-10">
                {t("home.autonomousOrchestration")}
              </p>

              <div className="stagger-children relative flex flex-wrap justify-center gap-4 lg:gap-6">
                {archNodes.map((node, i) => (
                  <div
                    key={node.label}
                    className="group w-[130px] sm:w-[150px] glass-card p-5 text-center transition-all hover:border-[#3b82f6]/30 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] cursor-pointer relative noise-overlay"
                  >
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-black border border-white/10 flex items-center justify-center group-hover:border-[#3b82f6]/30 transition-all">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="text-white/50 group-hover:text-[#3b82f6] transition-all">
                        {i === 0 && <><path d="M15 6a9 9 0 0 0-9 9V3" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /></>}
                        {i === 1 && <><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><circle cx="11.5" cy="14.5" r="2.5" /><path d="M13.3 16.3 15 18" /></>}
                        {i === 2 && <><path d="M12 18V5" /><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" /><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" /><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" /><path d="M18 18a4 4 0 0 0 2-7.464" /><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" /><path d="M6 18a4 4 0 0 1-2-7.464" /><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" /></>}
                        {i === 3 && <><path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z" /><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18" /><path d="m2.3 2.3 7.286 7.286" /><circle cx="11" cy="11" r="2" /></>}
                        {i === 4 && <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" /></>}
                        {i === 5 && <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>}
                      </svg>
                    </div>
                    <div className="font-montserrat-bold text-sm text-white mb-1">{node.label}</div>
                    <div className="text-[10px] leading-tight text-white/30 font-montserrat-bold uppercase tracking-[0.15em]">
                      {["Neural Gateway", "Vector Agent", "Cognitive Layer", "Execution Core", "Infra Layer", "Safety Protocol"][i]}
                    </div>
                    <div className="mt-2 text-[10px] text-white/40 opacity-0 transition-opacity group-hover:opacity-100 leading-snug">
                      {node.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* ──────────── DEPLOYMENT PIPELINE ──────────── */}
      <section className="snap-section relative z-10 px-6 lg:px-16">
        <ScrollSection>
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-8 flex items-center gap-4 lg:gap-8">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-montserrat-bold tracking-tighter uppercase">
                {t("home.pipeline")}
              </h2>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
              {[1, 2, 3].map((i) => ({
                num: `0${i}`,
                label: t(`home.step${i}Label`),
                title: t(`home.step${i}Title`),
                desc: t(`home.step${i}Desc`),
              })).map((step) => (
                <div key={step.num} className="glass-card p-8 lg:p-12 relative noise-overlay h-full">
                  <span className="absolute bottom-8 right-8 text-[80px] lg:text-[100px] font-montserrat-bold text-white/[0.02] select-none tracking-tighter">
                    {step.num}
                  </span>
                  <div className="flex flex-col gap-1 mb-4 lg:mb-6">
                    <h3 className="text-[9px] font-montserrat-bold text-[#3b82f6]/40 uppercase tracking-[0.4em] leading-none">
                      {step.label}
                    </h3>
                    <h4 className="text-xl lg:text-2xl font-montserrat-bold tracking-tight uppercase leading-tight">
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-base text-white/50 leading-relaxed font-montserrat-bold">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-6 bg-white/[0.01] border border-white/5 rounded-[40px] p-8">
              {stats.map((s) => (
                <StatCard key={s.label} {...s} start={statsVisible} />
              ))}
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* ──────────── ELITE SELECTION PROTOCOL ──────────── */}
      <section className="snap-section relative z-10 px-6 lg:px-16">
        <ScrollSection>
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="py-12">
              <div className="flex items-center gap-2 text-[#3b82f6] text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                {t("home.eliteProtocol")}
              </div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-montserrat-bold tracking-tighter mb-4 leading-[0.9] uppercase">
                {t("home.whoFor")}
              </h2>
              <div className="space-y-4">
                {[
                  "Premium agencies with a standardized, well-documented deliverable.",
                  "Visionary teams seeking absolute control through sovereign AI.",
                  "Companies that need SOTA private infrastructure, not generic chatbots.",
                  "Brands ready for elite web development platforms and maximum conversion.",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-4 text-sm lg:text-xl text-white/90 font-black pb-4 border-b border-white/5 uppercase tracking-tight group hover:border-[#3b82f6]/20 transition-all">
                    <div className="mt-1.5 relative shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] relative z-10 group-hover:scale-125 transition-transform">
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <div className="absolute inset-0 bg-[#3b82f6]/30 blur-md rounded-full scale-150" />
                    </div>
                    <span className="leading-tight">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-8 md:p-14 relative noise-overlay shadow-2xl">
              <h3 className="text-4xl font-black mb-4 uppercase leading-none">
                {t("home.auditCta")}
              </h3>
              <p className="text-xs text-white/40 mb-6 uppercase tracking-[0.4em] font-black">
                {t("home.auditButton")}
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="CONTACT@AGENCY.AI"
                  className="w-full px-8 py-5 bg-black/40 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#3b82f6]/40 focus:ring-1 focus:ring-[#3b82f6]/10 transition-all placeholder:text-white/10"
                />
                <ShimmerButton href="/contact">{t("home.auditButtonAlt")}</ShimmerButton>
              </div>
              <p className="mt-8 text-[8px] font-montserrat-regular text-white/10 leading-relaxed uppercase tracking-[0.3em]">
                &copy; 2026 ThinkFLOW Systems. Architecture based on Python / LangGraph / Docker. Elite Infrastructure.
              </p>
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* ──────────── SERVICES ──────────── */}
      <section className="snap-section relative z-10 px-6 lg:px-16" ref={servicesRef}>
        <ScrollSection>
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-4 text-center">
              <span className="inline-block glass-card px-4 py-1.5 text-xs font-montserrat-bold tracking-widest uppercase text-white/60">
                {t("services.badge")}
              </span>
            </div>
            <h2 className="mb-3 text-center text-3xl md:text-4xl lg:text-5xl font-montserrat-bold tracking-tighter uppercase">
              {t("services.title")}
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-center text-white/50 font-montserrat-bold text-sm uppercase tracking-widest">
              {t("services.description")}
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <div key={s.title} className="glass-card p-6 group hover:border-[#3b82f6]/20 transition-all relative noise-overlay">
                  <h3 className="mb-1 text-lg font-montserrat-bold group-hover:text-[#3b82f6] transition-colors">{s.title}</h3>
                  <p className="mb-2 text-sm text-[#3b82f6] font-montserrat-bold">{s.price}</p>
                  <p className="mb-4 text-sm text-white/50 font-montserrat-regular">{s.desc}</p>
                  {"external" in s && s.external ? (
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer sponsored nofollow"
                      className="text-sm text-[#3b82f6] underline font-montserrat-bold"
                    >
                      {t("services.viewOnFiverr")}
                    </a>
                  ) : (
                    <Link href={s.href} className="text-sm text-[#3b82f6] underline font-montserrat-bold">
                      {t("services.learnMore")}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollSection>
      </section>
    </div>
  );
}
