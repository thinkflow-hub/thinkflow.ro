import { getAllPosts } from "@/lib/posts";

const SITE = "https://thinkflow.ro";

export async function GET() {
  const posts = getAllPosts();

  const urls = posts
    .filter((p) => p.image)
    .map(
      (p) => `
  <url>
    <loc>${SITE}/blog/${p.slug}</loc>
    <image:image>
      <image:loc>${SITE}${p.image}</image:loc>
      <image:caption>${escapeXml(p.title)}</image:caption>
    </image:image>
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
