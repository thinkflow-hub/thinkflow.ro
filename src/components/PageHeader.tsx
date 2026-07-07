"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: string;
}

export default function PageHeader({ title, description, badge }: PageHeaderProps) {
  const [ref, visible] = useScrollReveal(0.01);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-b border-white/10 px-4 pt-32 pb-16 sm:pt-36 sm:pb-20 hero-grid"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#3b82f6]/5 to-transparent pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 bg-[radial-gradient(circle,#3b82f6,transparent_70%)] blur-[120px] pointer-events-none" />
      <div className={`relative z-10 mx-auto max-w-3xl text-center ${visible ? "animate-fade-in-up" : "opacity-0"}`}>
        {badge && (
          <span className="mb-4 inline-block glass-card px-4 py-1.5 text-xs font-montserrat-bold tracking-widest uppercase text-white/60">
            {badge}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-montserrat-bold tracking-tighter uppercase leading-[0.9]">
          {title}
        </h1>
        <p className="mt-4 text-base md:text-lg text-white/50 font-montserrat-bold max-w-xl mx-auto">
          {description}
        </p>
      </div>
    </section>
  );
}
