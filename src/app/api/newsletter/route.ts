import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// This endpoint used to fs.appendFileSync() to a hardcoded M:\ path. On Vercel
// that throws (read-only FS, and the drive doesn't exist), so every /news
// signup returned 500 and was lost. It now writes to the same Supabase table
// as the footer signup (/api/supabase/newsletter/subscribe), while keeping the
// { message, email } / { error } response shape NewsletterSignup.tsx expects.
export async function POST(request: NextRequest) {
  try {
    const { email, locale } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { error } = await getSupabase().from("newsletter_subscribers").upsert(
      {
        email,
        locale: locale || "en",
        source: "news",
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      } as never,
      { onConflict: "email", ignoreDuplicates: false }
    );

    if (error) {
      console.error("Supabase newsletter insert error:", error);
      return NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ message: "Subscribed", email }, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
