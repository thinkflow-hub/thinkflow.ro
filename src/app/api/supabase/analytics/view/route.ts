import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { slug, locale, referrer } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    await getSupabase().from("blog_views").insert({
      slug,
      locale: locale || "en",
      referrer: referrer || null,
      user_agent: request.headers.get("user-agent") || null,
    } as never);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
