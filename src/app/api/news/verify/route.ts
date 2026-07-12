import { NextRequest, NextResponse } from "next/server";
import { readVerification } from "@/lib/news";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("source_id");
  if (!sourceId) {
    return NextResponse.json({ error: "Missing source_id" }, { status: 400 });
  }

  const result = readVerification(sourceId);
  if (!result) {
    return NextResponse.json({ verification_status: null, sources_count: 0, sources: [] });
  }

  return NextResponse.json(result);
}
