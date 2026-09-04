import type { Metadata } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { getLocale } from "next-intl/server";
import { AttributionProvider } from "@/lib/attribution";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const blackSignature = localFont({
  src: "../../public/fonts/BlackSignature.otf",
  variable: "--font-black-signature",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thinkflow.ro"),
  title: {
    template: "%s | ThinkFLOW",
    default: "ThinkFLOW — Cloud Cost Audits, Website Care & Automation",
  },
  description:
    "Fixed-fee cloud cost audits, website creation and care, short-form clipping and Python automation. Real case study: 86% cloud bill cut, methodology public.",
  openGraph: {
    title: "ThinkFLOW — Cloud Cost Audits, Website Care & Automation",
    description: "Fixed-fee cloud cost audits, website creation and care, short-form clipping and Python automation.",
    url: "https://thinkflow.ro",
    siteName: "ThinkFLOW",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${montserrat.variable} ${geistMono.variable} ${blackSignature.variable} h-full antialiased`}
    >
      <head>
        <link rel="alternate" type="application/atom+xml" title="ThinkFLOW Blog Feed" href="https://thinkflow.ro/feed.xml" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ThinkFLOW",
              url: "https://thinkflow.ro",
              logo: "https://thinkflow.ro/logo.svg",
              description: "Fixed-fee cloud cost audits, website creation and care, short-form clipping and Python automation.",
              contactPoint: {
                "@type": "ContactPoint",
                email: "contact@thinkflow.ro",
                contactType: "sales",
              },
              sameAs: ["https://github.com/thinkflow-hub"],
            }),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <AttributionProvider>{children}</AttributionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
