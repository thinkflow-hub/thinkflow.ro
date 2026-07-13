"use client";

import { useEffect, useState } from "react";

interface MetricCard {
  label: string;
  value: string;
  status: "ok" | "warn" | "critical";
}

export default function SystemDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/system/metrics");
        if (res.ok) setData(await res.json());
        else setError(`HTTP ${res.status}`);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted animate-pulse">Loading system metrics...</div>;
  if (error) return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted">No data</div>;

  const { health, metrics, audit } = data;

  const cards: MetricCard[] = [];
  const h = health || {};

  // Overall status
  cards.push({ label: "System", value: h.overall || "unknown", status: h.overall === "ok" ? "ok" : "critical" });

  // Ollama
  if (h.ollama) cards.push({ label: "Ollama", value: `${h.ollama.models || "?"} models`, status: h.ollama.status === "ok" ? "ok" : "critical" });
  // Qdrant
  if (h.qdrant) cards.push({ label: "Qdrant", value: h.qdrant.status, status: h.qdrant.status === "ok" ? "ok" : "critical" });
  // VRAM
  if (h.vram) cards.push({ label: "VRAM", value: `${h.vram.free_mb || 0}MB free`, status: h.vram.status || "unknown" });
  // RAM
  if (h.ram) cards.push({ label: "RAM", value: `${h.ram.free_gb || 0}GB free`, status: h.ram.status || "unknown" });

  // Drives
  for (const key of Object.keys(h)) {
    if (key.endsWith("_drive") && h[key]) {
      cards.push({ label: key.replace("_drive", "").toUpperCase(), value: `${h[key].free_gb || 0}GB free`, status: h[key].status || "unknown" });
    }
  }

  // ContentFactory
  if (h.contentfactory) cards.push({ label: "ContentFactory", value: h.contentfactory.status, status: h.contentfactory.status === "ok" ? "ok" : "warn" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">System Dashboard</h1>
      <p className="text-sm text-muted mb-6">Real-time system metrics and health</p>

      {/* Health cards */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Health</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className={`rounded-xl border p-4 ${
              c.status === "ok" ? "border-green-500/20 bg-green-500/5" :
              c.status === "critical" ? "border-red-500/20 bg-red-500/5" :
              "border-yellow-500/20 bg-yellow-500/5"
            }`}>
              <p className="text-xs text-muted mb-1">{c.label}</p>
              <p className="text-lg font-semibold">{c.value}</p>
              <p className={`text-xs ${
                c.status === "ok" ? "text-green-500" :
                c.status === "critical" ? "text-red-500" : "text-yellow-500"
              }`}>{c.status}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agent metrics */}
      {metrics && Object.keys(metrics).length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Agent Metrics</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Agent</th>
                  <th className="px-4 py-2 text-right font-medium">Calls</th>
                  <th className="px-4 py-2 text-right font-medium">Errors</th>
                  <th className="px-4 py-2 text-right font-medium">Error Rate</th>
                  <th className="px-4 py-2 text-right font-medium">Avg Latency</th>
                  <th className="px-4 py-2 text-right font-medium">P95</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics).map(([id, m]: [string, any]) => (
                  <tr key={id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{id}</td>
                    <td className="px-4 py-2 text-right">{m.calls}</td>
                    <td className="px-4 py-2 text-right">{m.errors}</td>
                    <td className={`px-4 py-2 text-right ${m.error_rate > 10 ? "text-red-500" : ""}`}>{m.error_rate}%</td>
                    <td className="px-4 py-2 text-right">{m.avg_latency_ms}ms</td>
                    <td className="px-4 py-2 text-right">{m.p95_latency_ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Audit issues */}
      {audit && audit.issues && audit.issues.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Issues ({audit.issues.length})</h2>
          <div className="space-y-2">
            {audit.issues.map((issue: any, i: number) => (
              <div key={i} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm">
                <p className="font-medium">{issue.component}</p>
                <p className="text-muted text-xs">{issue.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {audit && audit.issues && audit.issues.length === 0 && (
        <p className="text-sm text-green-500">✅ All systems nominal. No issues detected.</p>
      )}
    </div>
  );
}
