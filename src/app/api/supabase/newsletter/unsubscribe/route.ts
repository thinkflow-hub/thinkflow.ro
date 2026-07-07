import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() } as never)
      .eq("email", email);

    if (error) {
      console.error("Supabase unsubscribe error:", error);
      return NextResponse.json({ error: "Failed to unsubscribe. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to unsubscribe. Please try again." }, { status: 500 });
  }
}
