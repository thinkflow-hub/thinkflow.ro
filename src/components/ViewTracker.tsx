"use client";

import { useEffect } from "react";

export default function ViewTracker({ slug, locale }: { slug: string; locale?: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const referrer = document.referrer || null;

    fetch("/api/supabase/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, locale: locale || "en", referrer }),
    }).catch(() => {});
  }, [slug, locale]);

  return null;
}
