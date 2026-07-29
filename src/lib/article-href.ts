// Single source of truth for turning an article into a route-safe key.
// `source_id` is the RSS FEED name (e.g. "hn_ai_24h"), not unique per article
// -- confirmed 2026-07-28: one feed produces a dozen+ articles/day sharing
// one source_id, so routing on it shows whichever article happens to match
// first. `url` is the actual per-article unique field, but a raw or
// percent-encoded url 404s against Next's single [source_id] route segment
// (the "%2F" sequences get decoded before route matching, so it looks like
// extra path segments) -- base64url-encode it into one slash-free token
// instead. No import from "@/lib/news" here: this file must stay import-safe
// in both server code (news.ts) and "use client" components.

export function encodeArticleKey(key: string): string {
  if (!/^https?:\/\//.test(key)) return key; // already a bare source_id, no slashes to worry about
  return btoa(encodeURIComponent(key)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function articleHref(item: { url?: string; source_id: string }): string {
  return item.url ? encodeArticleKey(item.url) : item.source_id;
}
