import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("privacy.title") };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <div>
      <PageHeader
        title={t("privacy.title")}
        description={t("privacy.description")}
        badge={t("privacy.badge")}
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">1. Data Controller</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              ThinkFLOW Systems (thinkflowhub@gmail.com, Bucharest, Romania) is the data controller for personal data collected
              through thinkflow.ro and related subdomains.
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              You can contact our data protection representative at:{" "}
              <Link href="/contact" className="text-[#3b82f6] underline font-montserrat-bold">thinkflowhub@gmail.com</Link>.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">2. What We Collect</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We collect: name and email address (via contact forms and newsletter signup), IP address and browser user agent
              (via server logs), cookie identifiers for affiliate tracking, and usage data
              (pages visited, time on site).
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We do not collect sensitive personal data (health, religion, political affiliation).
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">3. Legal Basis (GDPR Art. 6)</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We process your data based on: your consent (contact form submissions, newsletter signup, cookie consent —
              Art. 6(1)(a)), contract performance (service delivery — Art. 6(1)(b)), and legitimate interests
              (analytics, affiliate tracking, site security — Art. 6(1)(f)).
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">4. How We Use Your Data</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              To respond to inquiries and deliver services, to send newsletters (only with explicit consent), to improve our website and content, to track
              affiliate referrals and commissions, and to comply with legal obligations.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">5. Cookies</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We use only essential cookies for site functionality. Affiliate referral links use URL parameters
              (not cookies) for tracking. We do not use tracking cookies or third-party analytics cookies
              without your explicit consent. You can disable cookies in your browser settings.
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              When we implement analytics, you will be asked for consent via a cookie banner before any
              non-essential cookies are placed.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">6. Data Sharing and International Transfers</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We share data with: Vercel Inc. (US — hosting and server logs, covered by EU-US Data Privacy
              Framework), and email service providers for transactional emails. We do not sell personal
              data to third parties.
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              For transfers to the US, we rely on the EU-US Data Privacy Framework or Standard Contractual
              Clauses as applicable. A copy of the relevant safeguards is available on request.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">7. Data Retention</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We retain personal data for 24 months after the last contact. Newsletter subscription data
              is retained until you unsubscribe. Affiliate tracking data is
              retained for the duration of the affiliate program relationship. You may request earlier
              deletion at any time.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">8. Your Rights (GDPR)</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Under GDPR, you have the following rights:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-white/60 font-montserrat-regular text-sm">
              <li><strong className="text-white">Right of access</strong> (Art. 15) — request a copy of your data</li>
              <li><strong className="text-white">Right to rectification</strong> (Art. 16) — correct inaccurate data</li>
              <li><strong className="text-white">Right to erasure</strong> (Art. 17) — right to be forgotten</li>
              <li><strong className="text-white">Right to restrict processing</strong> (Art. 18)</li>
              <li><strong className="text-white">Right to data portability</strong> (Art. 20)</li>
              <li><strong className="text-white">Right to object</strong> (Art. 21) — including objection to direct marketing</li>
              <li><strong className="text-white">Right to withdraw consent</strong> at any time, without affecting the lawfulness of processing based on consent before its withdrawal</li>
            </ul>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              To exercise these rights, contact us at{" "}
              <Link href="/contact" className="text-[#3b82f6] underline font-montserrat-bold">thinkflowhub@gmail.com</Link>.
              We will respond within 30 days.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">9. Right to Lodge a Complaint</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              If you believe your data protection rights have been violated, you have the right to lodge a
              complaint with the Romanian National Supervisory Authority for Personal Data Processing
              (ANSPDCP — Autoritatea Nationala de Supraveghere a Prelucrarii Datelor cu Caracter Personal):
            </p>
            <p className="mt-2 leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Website: <span className="text-white">www.dataprotection.ro</span><br />
              Address: B-dul G-ral. Gheorghe Magheru, nr. 28-30, Sector 1, Bucuresti<br />
              Email: anspdcp@dataprotection.ro
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">10. CCPA Rights</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              California residents have the right to: know what personal data is collected, request
              deletion, and opt out of the sale of personal data. We do not sell personal data.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">11. Security</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We implement AES-256 encryption for stored data, TLS/HTTPS for all data in transit, and
              restricted access to personal data on a need-to-know basis. We conduct periodic security
              reviews.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">12. Changes to This Policy</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We will notify you of material changes to this policy via email (if we have your contact
              information) or a prominent notice on our website at least 30 days before changes take effect.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">13. Contact</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              For privacy-related inquiries:{" "}
              <Link href="/contact" className="text-[#3b82f6] underline font-montserrat-bold">thinkflowhub@gmail.com</Link>
              , Bucharest, Romania.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
