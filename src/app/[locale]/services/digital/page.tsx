"use client";

import { useState } from "react";

const SERVICES = [
  { id: "f08_translation", name: "Translation (EN ↔ RO)", price: "$35", desc: "Professional document translation between English and Romanian." },
  { id: "f09_resume", name: "Resume / CV Writing", price: "$40", desc: "ATS-optimized CV + cover letter generation." },
  { id: "f11_dataclean", name: "Data Cleaning", price: "$60", desc: "CSV/Excel deduplication, normalization, and cleaning." },
  { id: "f14_pdf", name: "PDF Processing", price: "$30", desc: "Compress, merge, split, or OCR your PDF files." },
];

export default function ServicesPage() {
  const [form, setForm] = useState({ service: "", email: "", details: "" });
  const [status, setStatus] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      const res = await fetch("/api/service/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setStatus(res.ok ? `Order placed! ID: ${data.order_id}` : `Error: ${data.error}`);
    } catch {
      setStatus("Network error. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Digital Services</h1>
      <p className="text-muted mb-8">AI-powered document processing services. Automated delivery.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-12">
        {SERVICES.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold">{s.name}</h3>
            <p className="text-sm text-muted mt-1">{s.desc}</p>
            <p className="text-lg font-bold mt-2">{s.price}</p>
            <button
              onClick={() => setForm({ ...form, service: s.id })}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Select →
            </button>
          </div>
        ))}
      </div>

      {form.service && (
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Order: {SERVICES.find((s) => s.id === form.service)?.name}</h2>
          <input
            type="email"
            placeholder="Your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Tell us what you need..."
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            required
            rows={4}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Place Order
          </button>
          {status && <p className="text-sm text-muted">{status}</p>}
        </form>
      )}
    </div>
  );
}
