"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Whitelist only — outbound links from email/ad platforms carry arbitrary extra
// params (?email=, ?e=, ?recipient=, fbclid, li_fat_id); a raw query string would
// silently store a recipient's address next to their own submitted name, outside
// the collection purpose declared in the privacy policy, and would make this
// column unaggregable.
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "ref", "src"];

function filterUtm(search: string): string {
  const params = new URLSearchParams(search);
  const pairs: string[] = [];
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) pairs.push(`${key}=${value}`);
  }
  return pairs.join("&");
}

type Attribution = {
  landing_page: string;
  referrer: string | null;
  utm: string;
};

const AttributionContext = createContext<Attribution>({
  landing_page: "",
  referrer: null,
  utm: "",
});

export function AttributionProvider({ children }: { children: ReactNode }) {
  const [value] = useState<Attribution>(() => {
    if (typeof window === "undefined") {
      return { landing_page: "", referrer: null, utm: "" };
    }
    return {
      landing_page: window.location.pathname,
      referrer: document.referrer || null,
      utm: filterUtm(window.location.search),
    };
  });

  // In-memory only: survives soft (client-side) navigation because the provider
  // stays mounted, and resets on reload — which is a new session anyway. Nothing is
  // written to the visitor's device, so no cookie-consent banner or policy change
  // is needed for this.

  return (
    <AttributionContext.Provider value={value}>{children}</AttributionContext.Provider>
  );
}

export function useAttribution() {
  const ctx = useContext(AttributionContext);
  return {
    ...ctx,
    last_page: typeof window !== "undefined" ? window.location.pathname : "",
  };
}
