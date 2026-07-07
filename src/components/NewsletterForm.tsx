"use client";

import { useState, FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NewsletterForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const email = (form.elements.namedItem("newsletter_email") as HTMLInputElement).value;
    const consent = (form.elements.namedItem("newsletter_consent") as HTMLInputElement)?.checked;

    if (!consent) {
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/supabase/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      if (!res.ok) throw new Error();
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p className="text-xs text-green-400 font-montserrat-regular">{t("newsletter.success")}</p>;
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          name="newsletter_email"
          placeholder={t("newsletter.placeholder")}
          required
          className="min-w-0 flex-1 border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/20 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="px-3 py-2 text-xs font-montserrat-bold uppercase tracking-wider text-white transition-colors bg-[#3b82f6] hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {status === "sending" ? t("newsletter.sending") : t("newsletter.subscribe")}
        </button>
      </form>
      <label className="mt-1.5 flex items-start gap-1.5">
        <input
          type="checkbox"
          name="newsletter_consent"
          required
          className="mt-0.5 h-3 w-3 shrink-0 accent-[#3b82f6]"
        />
        <span className="text-[9px] text-white/30 font-montserrat-regular leading-tight">
          {t("newsletter.consentIntro")}{" "}
          <Link href="/privacy" className="underline hover:text-white/50 transition-colors">{t("newsletter.privacy")}</Link>.
        </span>
      </label>
    </div>
  );
}
