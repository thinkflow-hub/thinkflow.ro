"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ContactForm() {
  const t = useTranslations();
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
        <p className="text-lg font-montserrat-bold text-white">{t("contact.success")}</p>
        <p className="mt-2 text-sm text-zinc-400 font-montserrat-regular">
          {t("contact.successHint")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-zinc-400">{t("contact.name")}</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
          placeholder={t("contact.namePlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-zinc-400">{t("contact.email")}</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
          placeholder={t("contact.emailPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="subject" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-zinc-400">{t("contact.subject")}</label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
          placeholder={t("contact.subjectPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-xs font-montserrat-bold uppercase tracking-[0.2em] text-zinc-400">{t("contact.message")}</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
          placeholder={t("contact.messagePlaceholder")}
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
          {t("contact.consentIntro")}{" "}
          <Link href="/privacy" className="underline text-[#3b82f6] hover:text-white transition-colors">
            {t("contact.privacy")}
          </Link>{" "}
          {t("contact.consentOutro")}
        </span>
      </label>

      {status === "error" && (
        <p className="text-xs text-red-400 font-montserrat-regular">
          {t("contact.error")}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="glass-button inline-flex w-full items-center justify-center gap-2 px-10 py-4 text-white font-montserrat-bold text-sm uppercase tracking-[0.25em] disabled:opacity-50"
      >
        {status === "sending" ? t("contact.sending") : t("contact.send")}
      </button>
    </form>
  );
}
