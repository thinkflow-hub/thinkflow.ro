import type { Metadata } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";
import localFont from "next/font/local";
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
    default: "ThinkFLOW — Private AI Infrastructure & Web Development",
  },
  description:
    "Private AI infrastructure, web development, and technical consulting. Custom LLM deployment, RAG pipelines, agent orchestration.",
  openGraph: {
    title: "ThinkFLOW — Private AI Infrastructure",
    description: "Custom AI infrastructure, web development, and technical consulting.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
              description: "Private AI infrastructure and web development services.",
              contactPoint: {
                "@type": "ContactPoint",
                email: "thinkflowhub@gmail.com",
                contactType: "sales",
              },
              sameAs: ["https://github.com/thinkflow-hub"],
            }),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
