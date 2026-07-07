"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
      consent: (form.elements.namedItem("consent") as HTMLInputElement).checked,
    };

    try {
      const res = await fetch("/api/supabase/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error();
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✓</div>
        <p className="text-lg font-montserrat-bold text-white">Message sent!</p>
        <p className="mt-2 text-sm text-zinc-400 font-montserrat-regular">
          We&apos;ll respond within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-zinc-400">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-zinc-400">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="subject" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-zinc-400">Subject</label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
          placeholder="Project type or question"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-zinc-400">Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
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
        <span className="text-xs text-zinc-500 font-montserrat-regular leading-tight">
          I agree to the{" "}
          <Link href="/privacy" className="underline text-[#3b82f6] hover:text-white transition-colors">
            Privacy Policy
          </Link>{" "}
          and consent to my data being processed for this inquiry.
        </span>
      </label>

      {status === "error" && (
        <p className="text-xs text-red-400 font-montserrat-regular">
          Failed to send. Please try again or email us directly at thinkflowhub@gmail.com.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="glass-button inline-flex w-full items-center justify-center gap-2 px-10 py-4 text-white font-montserrat-bold text-sm uppercase tracking-[0.25em] disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
