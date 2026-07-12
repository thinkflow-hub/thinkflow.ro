import type { NewsItem } from "@/lib/news-types";
import { CATEGORY_COLORS } from "@/lib/news-types";
import Link from "next/link";

export function NewsGallery({ items }: { items: NewsItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map((item) => {
        const catColor = CATEGORY_COLORS[item.category] || "#94a3b8";
        return (
          <Link
            key={item.source_id}
            href={`/news/article/${item.source_id}`}
            className="group relative flex aspect-[4/3] overflow-hidden rounded-lg border bg-muted transition-all hover:shadow-md hover:border-primary/30"
          >
            {item.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumbnail}
                alt=""
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ backgroundColor: catColor + "20" }}
              >
                <span className="text-2xl font-bold" style={{ color: catColor }}>
                  {item.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
              <span
                className="mb-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: catColor }}
              >
                {item.category}
              </span>
              <p className="text-xs font-medium text-white leading-tight line-clamp-2">
                {item.title}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
