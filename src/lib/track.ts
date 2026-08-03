export function track(kind: string, slug: string, referrer?: string) {
  fetch("/api/supabase/analytics/view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, kind, referrer: referrer ?? window.location.pathname }),
  }).catch(() => {});
}
