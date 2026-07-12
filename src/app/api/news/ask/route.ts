import { NextRequest, NextResponse } from "next/server";
import { readNewsFile, getAllDates } from "@/lib/news";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    if (!question || question.length < 3) {
      return NextResponse.json({ error: "Question too short" }, { status: 400 });
    }

    const q = question.toLowerCase();
    const dates = getAllDates();
    const searchDates = dates.slice(0, 30);
    let found: any[] = [];

    for (const date of searchDates) {
      const items = readNewsFile(date);
      for (const item of items) {
        const searchable = [
          item.title,
          item.description,
          item.summary,
          ...(item.keywords || []),
          item.source_name,
        ].filter(Boolean).join(" ").toLowerCase();

        if (searchable.includes(q)) {
          found.push({
            source_id: item.source_id,
            title: item.title,
            url: item.url,
            source_name: item.source_name,
            category: item.category,
            summary: item.summary || item.description?.slice(0, 200) || "",
            score: item.score,
            published: item.published,
          });
          if (found.length >= 10) break;
        }
      }
      if (found.length >= 10) break;
    }

    // Generate a simple response from results
    let answer: string;
    if (found.length === 0) {
      answer = `I couldn't find any articles matching "${question}" in the last ${searchDates.length} days. Try different keywords or browse the archive.`;
    } else {
      const categories = [...new Set(found.map((f) => f.category))].join(", ");
      answer = `Found ${found.length} articles about "${question}" across ${categories}. Here are the top results:\n\n`;
      found.slice(0, 5).forEach((f, i) => {
        answer += `${i + 1}. **${f.title}** (${f.source_name}, ${f.category})\n   ${f.summary.slice(0, 150)}...\n`;
      });
      if (found.length > 5) {
        answer += `\n...and ${found.length - 5} more articles. Refine your search for more specific results.`;
      }
    }

    return NextResponse.json({
      answer,
      sources: found.map((f) => ({ source_id: f.source_id, title: f.title, url: f.url })),
      total: found.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
