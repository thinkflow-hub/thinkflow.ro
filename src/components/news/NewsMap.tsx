"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface GeoPoint {
  source_id: string; title: string; city: string;
  lat: number; lng: number; category: string; score: number;
}

interface Props {
  locations: GeoPoint[];
}

const CATEGORY_COLORS: Record<string, string> = {
  trending: "#f59e0b", community: "#ef4444", open_source: "#6b7280",
  releases: "#22c55e", ai_labs: "#8b5cf6", research: "#06b6d4",
  newsletters: "#ec4899", industry: "#64748b",
};

export function NewsMap({ locations }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<GeoPoint | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet from CDN
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current || !(window as any).L) return;
    const L = (window as any).L;

    const map = L.map(mapRef.current).setView([30, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);

    locations.forEach((loc) => {
      const color = CATEGORY_COLORS[loc.category] || "#94a3b8";
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: Math.max(4, Math.min(loc.score || 5, 12)),
        fillColor: color,
        color: "#fff",
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.7,
      }).addTo(map);

      marker.bindPopup(`<b>${loc.title.slice(0, 60)}</b><br/>${loc.city} · ${loc.category}`);
      marker.on("click", () => setSelected(loc));
    });

    // Fit bounds if we have locations
    if (locations.length > 0) {
      const bounds = L.featureGroup(
        locations.map((l) => L.circleMarker([l.lat, l.lng]))
      ).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => map.remove();
  }, [loaded, locations]);

  if (locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl border bg-card">
        <p className="text-sm text-muted">No geo-located articles available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="h-[500px] w-full rounded-xl border z-0" />

      {selected && (
        <div className="rounded-xl border bg-card p-3 text-sm">
          <p className="font-medium">{selected.title}</p>
          <p className="text-xs text-muted mt-1">{selected.city} · {selected.category}</p>
          <Link
            href={`/news/article/${selected.source_id}`}
            className="mt-1 inline-block text-xs text-primary hover:underline"
          >
            Read more →
          </Link>
        </div>
      )}

      <p className="text-xs text-muted">
        {locations.length} geo-tagged stories from {[...new Set(locations.map((l) => l.city))].length} cities.
      </p>
    </div>
  );
}
