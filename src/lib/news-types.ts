export type Category =
  | "trending"
  | "community"
  | "open_source"
  | "releases"
  | "ai_labs"
  | "research"
  | "newsletters"
  | "industry";

export type Format = "article" | "video" | "podcast" | "event";
export type Sentiment = "positive" | "negative" | "neutral";

export interface NewsItem {
  source_id: string;
  source_name: string;
  title: string;
  url: string;
  description: string;
  published: string;
  score: number;
  category: Category;
  weight: number;
  format?: Format;
  tag?: string;
  stars?: number;
  language?: string;
  points?: number;
  comments_url?: string;
  upvotes?: number;
  subreddit?: string;
  num_comments?: number;
  summary?: string;
  summary_detailed?: string;
  summary_bullets?: string;
  thumbnail?: string | null;
  favicon?: string;
  sentiment?: Sentiment;
  keywords?: string[];
  cluster_id?: string;
  cluster_size?: number;
  cluster_topics?: string[];
  geo_title?: string;
  geo_keywords?: string[];
  schema_org?: Record<string, unknown>;
}

export interface NewsData {
  date: string;
  last_updated: string;
  total_items: number;
  enriched?: boolean;
  clustered?: boolean;
  geo_enriched?: boolean;
  items: NewsItem[];
  geo_metadata?: GeoMetadata;
}

export interface GeoMetadata {
  date: string;
  generated_at: string;
  schemas_generated: number;
  topics: string[];
  faq_items: { question: string; answer: string }[];
}

export interface DailyBriefing {
  date: string;
  generated_at: string;
  daily_briefing: string;
  category_summary: Record<string, string>;
  mood: string;
  top_stories_count: number;
  total_items: number;
}

export interface Metadata {
  dates: string[];
  categories: Category[];
  last_synced?: string;
  total_files?: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  trending: "Trending",
  community: "Community",
  open_source: "Open Source",
  releases: "Releases",
  ai_labs: "AI Labs",
  research: "Research",
  newsletters: "Newsletters",
  industry: "Industry",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  trending: "#f59e0b",
  community: "#ef4444",
  open_source: "#6b7280",
  releases: "#22c55e",
  ai_labs: "#8b5cf6",
  research: "#06b6d4",
  newsletters: "#ec4899",
  industry: "#64748b",
};

export const SENTIMENT_COLORS: Record<Sentiment, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#94a3b8",
};
