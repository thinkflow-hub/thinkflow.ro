import { getAllPosts } from "@/lib/posts";

export async function GET() {
  const posts = getAllPosts();

  const items = posts
    .map(
      (post) => `
    <entry>
      <title>${escapeXml(post.title)}</title>
      <link href="https://thinkflow.ro/blog/${post.slug}"/>
      <id>https://thinkflow.ro/blog/${post.slug}</id>
      <published>${new Date(post.date).toISOString()}</published>
      <updated>${new Date(post.date).toISOString()}</updated>
      <summary>${escapeXml(post.description)}</summary>
      <category term="${escapeXml(post.category)}"/>
    </entry>`
    )
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>ThinkFLOW Blog</title>
  <subtitle>Technical articles on AI infrastructure, web development, and cloud hosting.</subtitle>
  <link href="https://thinkflow.ro/feed.xml" rel="self"/>
  <link href="https://thinkflow.ro/blog" rel="alternate"/>
  <id>https://thinkflow.ro/feed.xml</id>
  <updated>${new Date().toISOString()}</updated>
  <author>
    <name>Daniel Burcea</name>
    <uri>https://thinkflow.ro/about</uri>
  </author>
  ${items}
</feed>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
