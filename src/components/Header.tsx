"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

const navLinks: { href: "/" | "/services" | "/blog" | "/news" | "/about" | "/contact"; labelKey: string }[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/services", labelKey: "nav.services" },
  { href: "/blog", labelKey: "nav.blog" },
  { href: "/news", labelKey: "nav.news" },
  { href: "/about", labelKey: "nav.about" },
  { href: "/contact", labelKey: "nav.contact" },
];

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
        scrolled ? "bg-black/80 backdrop-blur-[40px]" : "bg-transparent"
      }`}
    >
      <div className="px-4 sm:px-8 pt-2 sm:pt-3 pb-8 sm:pb-9">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-between w-full">
              <Link href="/" className="flex items-center gap-3 group shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl tracking-tighter uppercase leading-none">
                    <span className="font-signature normal-case text-white logo-think-glow">Think</span>
                    <span className="font-montserrat-extrabold text-[#3b82f6] ml-1">FLOW</span>
                  </span>
                </div>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs font-montserrat-bold uppercase tracking-widest text-white/60 hover:text-white transition-all"
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/15 p-1 rounded-2xl">
                  <button
                    onClick={() => switchLocale("en")}
                    className={`px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-montserrat-bold tracking-tight transition-all ${
                      locale === "en"
                        ? "bg-[#3b82f6] text-white shadow-lg shadow-[#3b82f6]/20"
                        : "text-white/30 hover:text-white"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => switchLocale("ro")}
                    className={`px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-montserrat-bold tracking-tight transition-all ${
                      locale === "ro"
                        ? "bg-[#3b82f6] text-white shadow-lg shadow-[#3b82f6]/20"
                        : "text-white/30 hover:text-white"
                    }`}
                  >
                    RO
                  </button>
                </div>
                <button
                  className="rounded-2xl bg-white/[0.05] border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all relative w-10 h-10 flex items-center justify-center md:hidden"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Toggle menu"
                >
                  <div className="relative w-5 h-4">
                    <span className={`absolute top-0 left-0 w-5 h-0.5 bg-white rounded-full transition-all ${menuOpen ? "top-2 rotate-45" : ""}`} />
                    <span className={`absolute top-2 left-0 w-5 h-0.5 bg-white rounded-full transition-all ${menuOpen ? "opacity-0" : ""}`} />
                    <span className={`absolute bottom-0 left-0 w-5 h-0.5 bg-white rounded-full transition-all ${menuOpen ? "top-2 -rotate-45" : ""}`} />
                  </div>
                </button>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-center justify-center mt-2">
              <div className="text-[10px] sm:text-[12px] font-montserrat-bold text-[#3b82f6] uppercase tracking-[0.4em] leading-none">
                {t("header.sota")}
              </div>
              <div className="text-[7px] sm:text-[9px] font-montserrat-bold text-white/40 uppercase tracking-[0.2em] sm:tracking-[0.3em] leading-none mt-[4px]">
                {t("header.tagline")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`border-t border-white/10 md:hidden mobile-nav-enter ${menuOpen ? "open" : ""}`}>
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-4 bg-black/90 backdrop-blur-[40px]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl px-4 py-3 text-sm font-montserrat-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
              onClick={() => setMenuOpen(false)}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
