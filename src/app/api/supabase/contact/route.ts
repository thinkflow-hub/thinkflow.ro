import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Email goes through Brevo's HTTP API, not SMTP: Vercel serverless blocks/times out
// outbound SMTP connections (nodemailer never worked in production — see
// vercel.com/kb/guide/serverless-functions-and-smtp), while HTTPS is unrestricted.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "ThinkFLOW", email: process.env.BREVO_SENDER_EMAIL || "contact@thinkflow.ro" };

export async function POST(request: Request) {
  const { name, email, subject, message: rawMessage, consent } = await request.json().catch(() => ({}));

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
      locale: "en",
      source: "contact_form",
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

  // The lead being captured is what matters to the visitor — notification is
  // best-effort. Only fail the request when BOTH channels lost the message.
  if (dbOk || emailOk) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Failed to send message. Please try again later." }, { status: 500 });
}
