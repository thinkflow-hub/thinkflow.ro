import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div>
      <PageHeader
        title="Terms of Service"
        description="Last updated: July 7, 2026"
        badge="Legal"
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">1. Services</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              ThinkFLOW provides private AI infrastructure deployment, web development, technical consulting,
              content creation, and automation services (&quot;Services&quot;). Each engagement is governed by a
              separate Statement of Work (SoW) or project proposal that references these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">2. Right of Withdrawal (EU Consumers)</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              If you are a consumer in the European Union, you have the right to withdraw from a service
              contract within 14 days without giving any reason. The withdrawal period expires 14 days
              after the day the contract is concluded.
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              To exercise the right of withdrawal, you must inform us of your decision by a clear statement
              (e.g., email to thinkflowhub@gmail.com). We will reimburse all payments received from you
              within 14 days of receiving your withdrawal notice.
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              <strong className="text-white">Exception:</strong> If you expressly request that the service
              begin during the withdrawal period and the service has been fully performed, the right of
              withdrawal expires.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">3. Intellectual Property</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              All code, configurations, and deliverables remain the intellectual property of ThinkFLOW until
              full payment is received. Upon final payment, full IP rights for the specific deliverables are
              transferred to the Client. ThinkFLOW retains the right to use generalized techniques and
              methodologies developed during the engagement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">4. Payment Terms</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Projects are billed 50% upfront and 50% upon delivery unless otherwise specified in the SoW.
              Invoices are issued in EUR and are due within 14 days of receipt. Late payments incur a 1.5%
              monthly interest charge.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">5. Confidentiality</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Both parties agree to treat all shared business and technical information as confidential for
              a period of 24 months after the engagement ends. This includes source code, architecture
              diagrams, business strategies, and client data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">6. Warranties and Disclaimer</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Services are provided &quot;as is&quot; and &quot;as available.&quot; We make no warranty that
              services will be uninterrupted, timely, secure, or error-free. We warrant that deliverables
              will conform to the agreed specifications for 30 days after delivery. Any non-conformance
              reported within this period will be corrected at no additional charge.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">7. Limitation of Liability</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              ThinkFLOW is not liable for indirect, incidental, or consequential damages arising from the
              use of our Services. Our total liability for any claim is limited to the total amount paid
              by the Client for the specific engagement giving rise to the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">8. Termination</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Either party may terminate an engagement with 14 days written notice. Upon termination, the
              Client pays for all work completed up to the termination date. Intellectual property for
              paid work is transferred per Section 3.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">9. Governing Law and Dispute Resolution</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              These Terms are governed by the laws of Romania. Any disputes shall first be attempted to be
              resolved through amicable negotiation. If negotiation fails, disputes shall be resolved in
              the courts of Bucharest, Romania.
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              The European Commission provides an online dispute resolution platform at{" "}
              <span className="text-white">ec.europa.eu/consumers/odr</span>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">10. Service Availability</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We aim for 99.9% uptime for hosted services but do not guarantee uninterrupted availability.
              Scheduled maintenance will be communicated at least 48 hours in advance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">11. Contact</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              For questions about these Terms, contact us at{" "}
              <Link href="/contact" className="text-[#3b82f6] underline font-montserrat-bold">thinkflowhub@gmail.com</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
