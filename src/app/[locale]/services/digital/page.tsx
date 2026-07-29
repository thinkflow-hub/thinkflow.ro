import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Digital Services — Coming Soon" };

const SERVICES = [
  { name: "Translation (EN ↔ RO)", desc: "Professional document translation between English and Romanian." },
  { name: "Resume / CV Writing", desc: "ATS-optimized CV + cover letter generation." },
  { name: "Data Cleaning", desc: "CSV/Excel deduplication, normalization, and cleaning." },
  { name: "PDF Processing", desc: "Compress, merge, split, or OCR your PDF files." },
];

export default function ServicesDigitalPage() {
  return (
    <div>
      <PageHeader title="Digital Services" description="Automated document processing — checkout coming soon." badge="Coming Soon" />

      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 mb-12">
          {SERVICES.map((s) => (
            <div key={s.name} className="glass-card p-6 noise-overlay">
              <h3 className="font-montserrat-bold">{s.name}</h3>
              <p className="mt-1 text-sm text-white/50 font-montserrat-regular">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-6 text-center noise-overlay">
          <p className="text-white/70 font-montserrat-regular">
            Online checkout for these services isn&apos;t live yet. In the meantime, reach out directly and we&apos;ll get it sorted manually.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block text-sm text-[#3b82f6] underline font-montserrat-bold"
          >
            Contact us →
          </Link>
        </div>
      </div>
    </div>
  );
}
