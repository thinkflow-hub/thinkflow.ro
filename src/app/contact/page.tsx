import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div>
      <PageHeader
        title="Contact"
        description="Get in touch — we usually respond within 24 hours."
        badge="Let's Talk"
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
