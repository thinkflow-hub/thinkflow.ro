import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL("/api/news/feed/all", request.url);
  return NextResponse.redirect(url, 307);
}
