import { getAllPosts, getPost } from "@/lib/posts";
import { routing } from "@/i18n/routing";

const SITE = "https://thinkflow.ro";

function localizedBlogPath(locale: string, slug: string): string {
  return locale === routing.defaultLocale ? `/blog/${slug}` : `/${locale}/blog/${slug}`;
}

function extractInlineImages(html: string): { src: string; alt: string }[] {
  const matches = [...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/g)];
  const seen = new Set<string>();
  const out: { src: string; alt: string }[] = [];
  for (const m of matches) {
    if (!m[1].startsWith("/") || seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push({ src: m[1], alt: m[2] });
  }
  return out;
}

export async function GET() {
  const entries: { loc: string; images: { src: string; caption: string }[] }[] = [];

  for (const locale of routing.locales) {
    const posts = getAllPosts(locale);
    for (const p of posts) {
      const full = await getPost(p.slug, locale);
      if (!full) continue;

      const images: { src: string; caption: string }[] = [];
      if (p.image) images.push({ src: p.image, caption: p.title });
      for (const img of extractInlineImages(full.content)) {
        images.push({ src: img.src, caption: img.alt || p.title });
      }
      if (!images.length) continue;

      entries.push({ loc: `${SITE}${localizedBlogPath(locale, p.slug)}`, images });
    }
  }

  const urls = entries
    .map(
      (e) => `
  <url>
    <loc>${e.loc}</loc>
${e.images
  .map(
    (img) => `    <image:image>
      <image:loc>${SITE}${img.src}</image:loc>
      <image:caption>${escapeXml(img.caption)}</image:caption>
    </image:image>`
  )
  .join("\n")}
  </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
