"use client";

// Client-side personalization engine (F5.2).
// Tracks reading history in localStorage and computes personalized scores.

interface ReadEvent {
  source_id: string;
  category: string;
  keywords: string[];
  source_name: string;
  ts: number;
}

interface Profile {
  reads: ReadEvent[];
  favCategories: Map<string, number>;
  favSources: Map<string, number>;
  favKeywords: Map<string, number>;
}

const STORAGE_KEY = "thinkflow_news_profile";
const MAX_EVENTS = 200;

function loadProfile(): Profile {
  if (typeof window === "undefined") return { reads: [], favCategories: new Map(), favSources: new Map(), favKeywords: new Map() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { reads: [], favCategories: new Map(), favSources: new Map(), favKeywords: new Map() };
    const parsed = JSON.parse(raw);
    return {
      reads: parsed.reads || [],
      favCategories: new Map(Object.entries(parsed.favCategories || {})),
      favSources: new Map(Object.entries(parsed.favSources || {})),
      favKeywords: new Map(Object.entries(parsed.favKeywords || {})),
    };
  } catch {
    return { reads: [], favCategories: new Map(), favSources: new Map(), favKeywords: new Map() };
  }
}

function saveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  const data = {
    reads: profile.reads,
    favCategories: Object.fromEntries(profile.favCategories),
    favSources: Object.fromEntries(profile.favSources),
    favKeywords: Object.fromEntries(profile.favKeywords),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full — trim
    profile.reads = profile.reads.slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function trackRead(source_id: string, category: string, keywords: string[], source_name: string) {
  const profile = loadProfile();
  const event: ReadEvent = { source_id, category, keywords: keywords || [], source_name, ts: Date.now() };
  profile.reads.push(event);
  if (profile.reads.length > MAX_EVENTS) {
    profile.reads = profile.reads.slice(-MAX_EVENTS);
  }
  profile.favCategories.set(category, (profile.favCategories.get(category) || 0) + 1);
  profile.favSources.set(source_name, (profile.favSources.get(source_name) || 0) + 1);
  for (const kw of keywords) {
    profile.favKeywords.set(kw, (profile.favKeywords.get(kw) || 0) + 1);
  }
  saveProfile(profile);
}

export function getPersonalizedScore(category: string, keywords: string[], source_name: string): number {
  const profile = loadProfile();
  let score = 1.0;
  score += (profile.favCategories.get(category) || 0) * 0.2;
  score += (profile.favSources.get(source_name) || 0) * 0.15;
  for (const kw of keywords) {
    score += (profile.favKeywords.get(kw) || 0) * 0.1;
  }
  return score;
}

export function getTopCategory(): string {
  const profile = loadProfile();
  let top = "";
  let max = 0;
  for (const [cat, count] of profile.favCategories) {
    if (count > max) { max = count; top = cat; }
  }
  return top;
}

export function getTopSource(): string {
  const profile = loadProfile();
  let top = "";
  let max = 0;
  for (const [src, count] of profile.favSources) {
    if (count > max) { max = count; top = src; }
  }
  return top;
}

export function getTotalReads(): number {
  return loadProfile().reads.length;
}

export function resetPersonalization() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
