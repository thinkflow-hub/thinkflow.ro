import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { slug, locale, referrer, kind } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    const { error } = await getSupabase().from("blog_views").insert({
      slug,
      locale: locale || "en",
      referrer: referrer || null,
      kind: kind || "view",
      user_agent: request.headers.get("user-agent") || null,
    } as never);

    if (error) {
      console.error("blog_views insert error:", error);
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("blog_views insert threw:", e);
    return NextResponse.json({ success: false });
  }
}
