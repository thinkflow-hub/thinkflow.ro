import Link from "next/link";
import BackToTop from "./BackToTop";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
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
                Private AI infrastructure based on Python, LangGraph, Docker. Elite Infrastructure.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-[10px] font-montserrat-bold text-white/40 uppercase tracking-[0.3em]">Pages</h3>
              <ul className="space-y-2">
                <li><Link href="/services" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">Services</Link></li>
                <li><Link href="/blog" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">Blog</Link></li>
                <li><Link href="/about" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">About</Link></li>
                <li><Link href="/contact" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-[10px] font-montserrat-bold text-white/40 uppercase tracking-[0.3em]">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/affiliate-disclosure" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">Affiliate Disclosure</Link></li>
                <li><Link href="/media-kit" className="text-sm text-white/50 font-montserrat-regular transition-colors hover:text-white">Media Kit</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-[10px] font-montserrat-bold text-white/40 uppercase tracking-[0.3em]">Connect</h3>
              <ul className="space-y-2 mb-6">
                <li><span className="text-sm text-white/50 font-montserrat-regular">thinkflowhub@gmail.com</span></li>
                <li><span className="text-sm text-white/50 font-montserrat-regular">Bucharest, Romania</span></li>
              </ul>
              <h3 className="mb-3 text-[10px] font-montserrat-bold text-white/40 uppercase tracking-[0.3em]">Stay Updated</h3>
              <NewsletterForm />
            </div>
          </div>

          <div className="mt-12 border-t border-white/5 pt-8 text-center">
            <p className="text-[10px] text-white/30 font-montserrat-regular uppercase tracking-[0.2em]">
              Some links on this site are affiliate links. See our{" "}
              <Link href="/affiliate-disclosure" className="underline hover:text-white transition-colors">
                Affiliate Disclosure
              </Link>.
            </p>
            <p className="mt-3 text-[10px] text-white/30 font-montserrat-regular uppercase tracking-[0.2em]">
              &copy; {year} ThinkFLOW Systems. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
