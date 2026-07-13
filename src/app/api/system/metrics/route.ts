import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Run the alerting module via subprocess to get metrics
    const { execSync } = await import("child_process");
    const result = execSync(
      `python -c "
import sys; sys.path.insert(0, r'M:\\thinkflow\\openclaw\\src')
from utils.self_heal import health_check, get_metrics, audit_all
import json
print(json.dumps({'health': health_check(), 'metrics': get_metrics(), 'audit': audit_all()}))
"`,
      { timeout: 15000, encoding: "utf-8" }
    );
    const data = JSON.parse(result.trim());
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Metrics unavailable", detail: String(error).slice(0, 200) },
      { status: 503 }
    );
  }
}
