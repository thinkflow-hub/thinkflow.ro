import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SUBSCRIBERS_FILE = path.join("M:", "thinkflow", "openclaw", "_data", "newsletter_subscribers.txt");

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const dir = path.dirname(SUBSCRIBERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Read existing subscribers
    let existing = new Set<string>();
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const raw = fs.readFileSync(SUBSCRIBERS_FILE, "utf-8");
      existing = new Set(raw.split("\n").map((l) => l.trim()).filter(Boolean));
    }

    if (existing.has(email)) {
      return NextResponse.json({ message: "Already subscribed", email }, { status: 200 });
    }

    fs.appendFileSync(SUBSCRIBERS_FILE, email + "\n", "utf-8");
    return NextResponse.json({ message: "Subscribed", email }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
