"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { PostMeta } from "@/lib/posts";
import { ArrowRight, Search, LayoutGrid, List, ChevronRight, FileText, Code, Sparkles } from "lucide-react";

const ALL_CATEGORY = "All";

function BlogCard({ post, index }: { post: PostMeta; index: number }) {
  const t = useTranslations();
  const [ref, visible] = useScrollReveal(0.05);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group relative noise-overlay glass-card p-0 block transition-all duration-300 hover:scale-[1.02] hover:border-[#3b82f6]/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] overflow-hidden"
      >
        {post.image && (
          <div className="relative w-full aspect-[120/63] overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/40 font-montserrat-regular mb-3">
            <time>{post.date}</time>
            <span className="text-white/20">·</span>
            <span>{post.readingTime} min read</span>
          </div>
          <h2 className="mb-2 text-lg font-montserrat-bold group-hover:text-[#3b82f6] transition-colors duration-300">
            {post.title}
          </h2>
          <p className="mb-4 text-sm text-white/50 font-montserrat-regular leading-relaxed line-clamp-2">
            {post.description}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/40 font-montserrat-regular"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-montserrat-bold text-white/20 group-hover:text-[#3b82f6] transition-all duration-300">
            <span>{t("blog.readMore")}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </div>
  );
}

function FeaturedCard({ post }: { post: PostMeta }) {
  const t = useTranslations();
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative noise-overlay glass-card p-8 md:p-10 grid md:grid-cols-5 gap-8 transition-all duration-500 hover:border-[#3b82f6]/30 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.04] bg-[radial-gradient(circle,#3b82f6,transparent_70%)] blur-[60px] pointer-events-none" />
      <div className="md:col-span-3 relative z-10">
          <span className="mb-3 inline-block text-[10px] font-montserrat-bold tracking-[0.3em] uppercase text-[#3b82f6]">
            {t("blog.featured")}
          </span>
        <h2 className="mb-3 text-2xl md:text-3xl font-montserrat-bold group-hover:text-[#3b82f6] transition-colors duration-300 leading-tight">
          {post.title}
        </h2>
        <p className="mb-4 text-sm md:text-base text-white/50 font-montserrat-regular leading-relaxed">
          {post.description}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-white/40 font-montserrat-regular">
            <time>{post.date}</time>
            <span className="text-white/20">·</span>
            <span>{post.readingTime} min read</span>
          </div>
          <span className="rounded-full bg-[#3b82f6]/10 px-3 py-1 text-[10px] font-montserrat-bold text-[#3b82f6] tracking-wider uppercase">
            {post.category}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs font-montserrat-bold text-[#3b82f6]">
          <span>{t("blog.readFullAnalysis")}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
      <div className="hidden md:flex md:col-span-2 items-center justify-center relative z-10">
        {post.image ? (
          <div className="relative w-full aspect-[120/63] rounded-2xl overflow-hidden border border-white/5">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        ) : (
          <div className="w-full h-full min-h-[140px] rounded-2xl border border-white/5 bg-gradient-to-br from-[#3b82f6]/5 via-transparent to-[#3b82f6]/10 flex items-center justify-center group-hover:border-[#3b82f6]/15 transition-all">
            <div className="text-center p-4">
              <div className="text-[40px] font-montserrat-extrabold text-white/5 select-none leading-none">
                {post.category === "Cloud Hosting" ? <FileText className="w-12 h-12 inline-block" /> : post.category === "AI Infrastructure" ? <Code className="w-12 h-12 inline-block" /> : <Sparkles className="w-12 h-12 inline-block" />}
              </div>
              <div className="mt-2 text-[10px] font-montserrat-bold text-white/15 uppercase tracking-[0.3em]">
                {post.category}
              </div>
              {post.affiliatePrograms.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {post.affiliatePrograms.map((ap) => (
                    <span key={ap} className="text-[8px] font-montserrat-regular text-white/10 uppercase tracking-wider border border-white/5 rounded-full px-2 py-0.5">
                      {ap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

interface BlogContentProps {
  posts: PostMeta[];
  categories: string[];
}

export default function BlogContent({ posts, categories }: BlogContentProps) {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetch("/api/supabase/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "blog" }),
    }).catch(() => {});
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (activeCategory !== ALL_CATEGORY && p.category !== activeCategory) return false;
      if (activeTags.size > 0 && !p.tags.some((t) => activeTags.has(t))) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !p.title.toLowerCase().includes(term) &&
          !p.description.toLowerCase().includes(term) &&
          !p.tags.some((t) => t.toLowerCase().includes(term))
        )
          return false;
      }
      return true;
    });
  }, [posts, activeCategory, activeTags, searchTerm]);

  const featured = filteredPosts[0];
  const remaining = filteredPosts.slice(1);

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function clearFilters() {
    setActiveCategory(ALL_CATEGORY);
    setActiveTags(new Set());
    setSearchTerm("");
  }

  const hasActiveFilters = activeCategory !== ALL_CATEGORY || activeTags.size > 0 || searchTerm.length > 0;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10 px-4 pt-32 pb-12 sm:pt-36 sm:pb-16 hero-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3b82f6]/5 to-transparent pointer-events-none" />
        <div className="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 bg-[radial-gradient(circle,#3b82f6,transparent_70%)] blur-[120px] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-block glass-card px-4 py-1.5 text-xs font-montserrat-bold tracking-widest uppercase text-white/60">
            {t("blog.badge")}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-montserrat-bold tracking-tighter uppercase leading-[0.9]">
            Blog
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/50 font-montserrat-bold max-w-xl mx-auto">
            {t("blog.description")}
          </p>
          <div className="mt-6 text-sm text-white/30 font-montserrat-regular">
            {t("blog.publishedCount", { count: posts.length })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* ── Toolbar: search + filters + view toggle ── */}
        <div className="mb-8 space-y-4">
          {/* Search row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("blog.searchPlaceholder")}
                className="w-full border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 font-montserrat-regular outline-none transition-colors focus:border-[#3b82f6]"
              />
            </div>
            <div className="flex items-center gap-1 rounded border border-white/10 bg-white/5 p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
                  title={t("blog.gridView")}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
                  title={t("blog.listView")}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {[ALL_CATEGORY, ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-[10px] font-montserrat-bold tracking-wider uppercase transition-all duration-200 ${
                  activeCategory === cat
                    ? "text-[#3b82f6] border-b-2 border-[#3b82f6] bg-[#3b82f6]/5"
                    : "text-white/40 hover:text-white/70 border-b-2 border-transparent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tag chips */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const isActive = activeTags.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 text-[10px] font-montserrat-regular rounded-full border transition-all duration-200 ${
                      isActive
                        ? "border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#3b82f6]"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active filter count + clear */}
          {hasActiveFilters && (
            <div className="flex items-center gap-3 text-xs text-white/40 font-montserrat-regular">
              <span>
                {t("blog.showingCount", { filtered: filteredPosts.length, total: posts.length })}
              </span>
              <button
                onClick={clearFilters}
                className="text-[#3b82f6] underline hover:text-white transition-colors"
              >
                {t("blog.clearFilters")}
              </button>
            </div>
          )}
        </div>

        {/* ── Posts ── */}
        {filteredPosts.length === 0 ? (
          <div className="glass-card p-12 text-center relative noise-overlay">
            <p className="text-lg text-white/60 font-montserrat-bold">{t("blog.noResults")}</p>
            <p className="mt-2 text-sm text-white/40 font-montserrat-regular">
              {t("blog.noResultsHint")}
            </p>
          </div>
        ) : (
          <>
            {featured && hasActiveFilters && (
              <div className="mb-6">
                <span className="text-xs text-white/30 font-montserrat-bold uppercase tracking-wider">
                  {t("blog.results")}
                </span>
              </div>
            )}

            {featured && !hasActiveFilters && (
              <div className="mb-8">
                <FeaturedCard post={featured} />
              </div>
            )}

            {viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {remaining.map((post, i) => (
                  <BlogCard key={post.slug} post={post} index={i} />
                ))}
                {featured && hasActiveFilters && (
                  <BlogCard key={featured.slug} post={featured} index={remaining.length} />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {(hasActiveFilters ? filteredPosts : remaining).map((post, i) => (
                  <div key={post.slug}>
                    <ListCard post={post} index={i} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ListCard({ post, index }: { post: PostMeta; index: number }) {
  const [ref, visible] = useScrollReveal(0.05);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group relative noise-overlay glass-card p-5 flex items-center gap-6 transition-all duration-300 hover:border-[#3b82f6]/20"
      >
        {post.image ? (
          <div className="relative w-20 h-14 shrink-0 rounded-lg overflow-hidden border border-white/5 hidden sm:block">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        ) : (
          <div className="hidden sm:flex items-center justify-center w-12 h-12 shrink-0 rounded-full border border-white/5 bg-gradient-to-br from-[#3b82f6]/5 to-transparent">
            <span className="text-lg font-montserrat-extrabold text-white/10">{post.title[0]}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/40 font-montserrat-regular mb-1">
            <time>{post.date}</time>
            <span className="text-white/20">·</span>
            <span>{post.readingTime} min read</span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] tracking-wider uppercase text-white/30 font-montserrat-bold">
              {post.category}
            </span>
          </div>
          <h2 className="text-base font-montserrat-bold group-hover:text-[#3b82f6] transition-colors duration-300 truncate">
            {post.title}
          </h2>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0 text-white/20 group-hover:text-[#3b82f6] transition-all duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
