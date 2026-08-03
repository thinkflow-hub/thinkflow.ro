"use client";

import { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/track";

// The pages that need cta_click/fiverr_click are server components (getTranslations,
// generateStaticParams) — an onClick handler needs a client boundary, so it lives
// here rather than inline on each Link.
export default function TrackedLink({
  href, external, kind, slug, className, children, target, rel,
}: {
  href: string;
  external?: boolean;
  kind: string;
  slug: string;
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
}) {
  const onClick = () => track(kind, slug);

  if (external) {
    return (
      <a href={href} target={target} rel={rel} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
