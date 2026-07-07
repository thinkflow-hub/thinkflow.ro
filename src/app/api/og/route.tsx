import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const LOGO_COLORS: Record<string, string> = {
  vultr: "#0077FF", hetzner: "#D50C2D", digitalocean: "#0080FF",
  cloudflare: "#F38020", vercel: "#000000", supabase: "#3ECF8E",
  elevenlabs: "#FF6B6B", sentry: "#362D59", aws: "#FF9900",
  pinecone: "#005B4F", weaviate: "#4C51BF", chroma: "#FF6B6B",
  zilliz: "#00A1FF", datadog: "#632CA6", linode: "#00A95C",
  namecheap: "#DE3C3C", cloudways: "#2D3748", openai: "#74AA9C",
  milvus: "#00A1FF", qdrant: "#EB1C24",
};

async function fetchLogoAsWhiteDataUri(origin: string, name: string): Promise<string | null> {
  try {
    const res = await fetch(`${origin}/images/logos/${name}.svg`);
    if (!res.ok) return null;
    let svg = await res.text();

    if (svg.includes("<rect") && !svg.includes("base64") && svg.length < 5000) {
      svg = svg.replace(/\bfill="[^"]*"/gi, 'fill="#FFFFFF"');
      svg = svg.replace(/\bstroke="[^"]*"/gi, 'stroke="#FFFFFF"');
    }

    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "ThinkFLOW";
  const category = searchParams.get("category") || "";
  const tags = searchParams.get("tags") || "";
  const logosParam = searchParams.get("logos") || "";

  const fontData = await fetch(
    `${req.nextUrl.origin}/fonts/Geist-Regular.ttf`
  ).then((res) => res.arrayBuffer());

  const hasLogos = logosParam.length > 0;
  const logoKeys = hasLogos ? logosParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 4) : [];

  let logoDataUris: (string | null)[] = [];
  if (logoKeys.length > 0) {
    logoDataUris = await Promise.all(
      logoKeys.map((key) => fetchLogoAsWhiteDataUri(req.nextUrl.origin, key))
    );
  }

  const fontSize = title.length > 60 ? 40 : title.length > 40 ? 48 : 56;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a0f 0%, #111118 40%, #0f0f1a 100%)",
          fontFamily: "'Geist', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30%",
            left: "-10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            position: "absolute",
            top: "40px",
            left: "56px",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="rgba(59,130,246,0.2)" />
            <path d="M10 22V10l6 6 6-6v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: "20px", fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.02em" }}>
            ThinkFLOW
          </span>
        </div>

        {/* Center content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: hasLogos ? "center" : "flex-start",
            flex: 1,
            padding: "0 56px",
            paddingTop: hasLogos ? "0" : "20px",
          }}
        >
          {/* Logos row */}
          {hasLogos && logoDataUris.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "32px",
                marginBottom: "24px",
              }}
            >
              {logoDataUris.map((uri, i) =>
                uri ? (
                  <img
                    key={logoKeys[i]}
                    src={uri}
                    alt={logoKeys[i]}
                    style={{
                      height: "48px",
                      width: "auto",
                      opacity: 0.6,
                    }}
                  />
                ) : (
                  <span
                    key={logoKeys[i]}
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      fontWeight: 500,
                      padding: "4px 12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "4px",
                    }}
                  >
                    {logoKeys[i]}
                  </span>
                )
              )}
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              maxWidth: "900px",
              textAlign: hasLogos ? "center" : "left",
              margin: 0,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Bottom bar: category + tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            justifyContent: hasLogos ? "center" : "flex-start",
            padding: "0 56px 40px",
          }}
        >
          {category && (
            <span
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.6)",
                background: "rgba(255,255,255,0.06)",
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {category}
            </span>
          )}
          {tags &&
            tags
              .split(",")
              .slice(0, 3)
              .map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.4)",
                    background: "rgba(255,255,255,0.04)",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {tag.trim()}
                </span>
              ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Geist",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );
}
