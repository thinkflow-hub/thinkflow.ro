"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import BackToTop from "./BackToTop";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <>
      <BackToTop />
      <footer className="border-t border-white/10 bg-black/90 backdrop-blur-[40px]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-4">
                <span className="text-xl tracking-tighter uppercase leading-none">
                  <span className="font-signature normal-case text-white logo-think-glow">Think</span>
                  <span className="font-montserrat-extrabold text-[#3b82f6] ml-0.5">FLOW</span>
                </span>
              </div>
              <p className="text-xs text-white/40 font-montserrat-bold uppercase tracking-widest leading-relaxed">
                {t("footer.description")}
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-[10px] font-montserrat-bold text-white/40 uppercase tracking-[0.3em]">{t("footer.pages")}</h3>
              <ul className="space-y-2">
                <li><Link href="/services" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">{t("nav.services")}</Link></li>
                <li><Link href="/blog" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">{t("nav.blog")}</Link></li>
                <li><Link href="/about" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">{t("nav.about")}</Link></li>
                <li><Link href="/contact" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">{t("nav.contact")}</Link></li>
                <li><Link href="/news" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">{t("nav.news")}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-[10px] font-montserrat-bold text-white/40 uppercase tracking-[0.3em]">{t("footer.legal")}</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">{t("footer.terms")}</Link></li>
                <li><Link href="/privacy" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">{t("footer.privacy")}</Link></li>
                <li><Link href="/affiliate-disclosure" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">{t("footer.affiliate")}</Link></li>
                <li><Link href="/media-kit" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">{t("footer.mediaKit")}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-[10px] font-montserrat-bold text-white/40 uppercase tracking-[0.3em]">{t("footer.connect")}</h3>
              <ul className="space-y-2 mb-6">
                <li><span className="text-sm text-white/50 font-montserrat-regular">{t("footer.email")}</span></li>
                <li><span className="text-sm text-white/50 font-montserrat-regular">{t("footer.location")}</span></li>
              </ul>
              <h3 className="mb-3 text-[10px] font-montserrat-bold text-white/40 uppercase tracking-[0.3em]">{t("footer.stayUpdated")}</h3>
              <NewsletterForm />
            </div>
          </div>

          <div className="mt-12 border-t border-white/5 pt-8 text-center">
            <p className="text-[10px] text-white/30 font-montserrat-regular uppercase tracking-[0.2em]">
              {t("footer.affiliateNotice")}{" "}
              <Link href="/affiliate-disclosure" className="underline hover:text-white transition-colors">
                {t("footer.affiliate")}
              </Link>.
            </p>
            <p className="mt-3 text-[10px] text-white/30 font-montserrat-regular uppercase tracking-[0.2em]">
              {t("footer.copyright", { year })}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
