"use client";

import { Link as LinkIcon } from "lucide-react";

interface Props {
  slug: string;
  title: string;
}

export default function ShareButtons({ slug, title }: Props) {
  const url = `https://thinkflow.ro/blog/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="mt-8 flex items-center gap-3">
      <span className="text-sm text-muted">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-accent hover:text-accent"
        aria-label="Share on Twitter"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <button
        onClick={copyLink}
        className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-accent hover:text-accent"
        aria-label="Copy link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
