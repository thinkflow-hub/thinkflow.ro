import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div>
      <PageHeader
        title="Contact"
        description="Get in touch — we usually respond within 24 hours."
        badge="Let's Talk"
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <form action="/api/contact" method="POST" className="space-y-6">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-white/50">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-white/50">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-white/50">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
                placeholder="Project type or question"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-white/50">Message</label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
                placeholder="Tell us about your project"
              />
            </div>

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="consent"
                required
                className="mt-1 h-4 w-4 shrink-0 accent-[#3b82f6]"
              />
              <span className="text-xs text-white/40 font-montserrat-regular leading-tight">
                I agree to the{" "}
                <Link href="/privacy" className="underline text-[#3b82f6] hover:text-white transition-colors">
                  Privacy Policy
                </Link>{" "}
                and consent to my data being processed for this inquiry.
              </span>
            </label>

            <button
              type="submit"
              className="glass-button inline-flex w-full items-center justify-center gap-2 px-10 py-4 text-white font-montserrat-bold text-sm uppercase tracking-[0.25em]"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
