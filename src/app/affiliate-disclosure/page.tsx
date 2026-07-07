import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
};

export default function AffiliateDisclosurePage() {
  return (
    <div>
      <PageHeader
        title="Affiliate Disclosure"
        description="Transparency about our affiliate relationships. FTC and GDPR compliant."
        badge="Legal"
      />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card p-8 md:p-12 relative noise-overlay">
          <section className="mb-8">
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              ThinkFLOW participates in affiliate marketing programs. This means that some of the links on
              our website are affiliate links. If you click on an affiliate link and make a purchase, we
              may earn a commission at no additional cost to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">Our Commitment</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              We only recommend products and services that we have personally tested, evaluated, or have
              strong reason to believe will provide value to our readers. Our reviews and comparisons are
              based on actual testing, benchmarks, and honest assessment of pros and cons. Affiliate
              relationships do not influence our editorial content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">Programs We Participate In</h2>
            <ul className="list-disc space-y-1 pl-6 text-white/60 font-montserrat-regular text-sm">
              <li>Vercel Affiliate Program</li>
              <li>Cloudflare Partner Program</li>
              <li>Supabase Partner Program</li>
              <li>Pinecone Affiliate Program</li>
              <li>ElevenLabs Affiliate Program</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">How We Identify Affiliate Links</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              Affiliate links on thinkflow.ro are marked with{" "}
              <code className="text-white/80">rel=&quot;sponsored nofollow&quot;</code> attributes. Some may include UTM parameters
              for tracking purposes. We also place affiliate disclosure notices at the top and bottom of
              any page containing affiliate links.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-montserrat-bold">Questions?</h2>
            <p className="leading-relaxed text-white/60 font-montserrat-regular text-sm">
              If you have any questions about our affiliate relationships, please contact us at
              thinkflowhub@gmail.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
