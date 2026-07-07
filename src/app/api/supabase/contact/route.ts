import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message: rawMessage, consent } = await request.json();

    if (!name || !email || !rawMessage) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    if (!consent) {
      return NextResponse.json({ error: "You must agree to the Privacy Policy." }, { status: 400 });
    }

    const { error: dbError } = await getSupabase().from("contacts").insert({
      name,
      email,
      subject: subject || null,
      message: rawMessage,
      consent,
      locale: "en",
      source: "contact_form",
    } as never);

    if (dbError) {
      console.error("Supabase insert error:", dbError);
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const text = `Name: ${name}\nEmail: ${email}\nSubject: ${subject || "Not specified"}\nConsent: Yes\n\nMessage:\n${rawMessage}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"ThinkFLOW Contact" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || "thinkflowhub@gmail.com",
      subject: `[ThinkFLOW Contact] ${subject || "New inquiry"} from ${name}`,
      text,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send message. Please try again later." }, { status: 500 });
  }
}
