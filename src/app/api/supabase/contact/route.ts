import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Email goes through Brevo's HTTP API, not SMTP: Vercel serverless blocks/times out
// outbound SMTP connections (nodemailer never worked in production — see
// vercel.com/kb/guide/serverless-functions-and-smtp), while HTTPS is unrestricted.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "ThinkFLOW", email: process.env.BREVO_SENDER_EMAIL || "contact@thinkflow.ro" };

export async function POST(request: Request) {
  const {
    name, email, subject, message: rawMessage, consent, locale: rawLocale,
    landing_page, last_page, referrer, utm,
  } = await request.json().catch(() => ({}));

  // Only ever store a locale the site actually serves; anything else is client input.
  const locale = rawLocale === "ro" ? "ro" : "en";

  if (!name || !email || !rawMessage) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "You must agree to the Privacy Policy." }, { status: 400 });
  }

  let dbOk = false;
  try {
    const { error: dbError } = await getSupabase().from("contacts").insert({
      name,
      email,
      subject: subject || null,
      message: rawMessage,
      consent,
      locale,
      source: "contact_form",
      landing_page: landing_page || null,
      last_page: last_page || null,
      referrer: referrer || null,
      utm: utm || null,
      status: "new",
    } as never);
    dbOk = !dbError;
    if (dbError) console.error("Supabase insert error:", dbError);
  } catch (e) {
    console.error("Supabase insert threw:", e);
  }

  let emailOk = false;
  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: { "api-key": process.env.BREVO_API_KEY || "", "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: process.env.CONTACT_EMAIL || "thinkflowhub@gmail.com" }],
        replyTo: { email, name },
        subject: `[ThinkFLOW Contact] ${subject || "New inquiry"} from ${name}`,
        textContent: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || "Not specified"}\nConsent: Yes\n\nMessage:\n${rawMessage}`,
      }),
    });
    emailOk = res.ok;
    if (!res.ok) console.error("Brevo API error:", res.status, (await res.text()).slice(0, 300));
  } catch (e) {
    console.error("Brevo API threw:", e);
  }

  // Track delivery outcome directly — a serverless function has no origin to fetch
  // its own API routes against, so this writes to blog_views itself rather than
  // going through src/lib/track.ts (client-only). The two checks are independent,
  // not either/or: a partial failure (one channel down) is BOTH a captured lead
  // (dbOk || emailOk — worth counting) AND an ops problem worth alerting on.
  try {
    if (dbOk || emailOk) {
      await getSupabase().from("blog_views").insert({
        slug: last_page || "contact", kind: "contact_submit_ok", locale, referrer: referrer || null,
      } as never);
    }
    if (!dbOk || !emailOk) {
      const failKind = !dbOk && !emailOk ? "both" : !dbOk ? "db_fail" : "email_fail";
      await getSupabase().from("blog_views").insert({
        slug: failKind, kind: "contact_submit_fail", locale, referrer: referrer || null,
      } as never);
    }
  } catch (e) {
    console.error("contact_submit tracking insert threw:", e);
  }

  // The lead being captured is what matters to the visitor — notification is
  // best-effort. Only fail the request when BOTH channels lost the message.
  if (dbOk || emailOk) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Failed to send message. Please try again later." }, { status: 500 });
}
