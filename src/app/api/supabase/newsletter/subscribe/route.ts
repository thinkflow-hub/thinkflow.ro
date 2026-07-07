import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, locale } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const { error } = await getSupabase().from("newsletter_subscribers").upsert(
      {
        email,
        locale: locale || "en",
        source: "footer",
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      } as never,
      { onConflict: "email", ignoreDuplicates: false }
    );

    if (error) {
      console.error("Supabase newsletter insert error:", error);
      return NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 500 });
  }
}
