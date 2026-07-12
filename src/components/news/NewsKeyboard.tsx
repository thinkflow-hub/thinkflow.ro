"use client";

import { useEffect, useCallback, useState } from "react";

interface NewsKeyboardOptions {
  onNext?: () => void;
  onPrev?: () => void;
  onOpen?: () => void;
  onSearch?: () => void;
  onToggleBriefing?: () => void;
  onToggleCategory?: () => void;
}

export function useNewsKeyboard(opts: NewsKeyboardOptions) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          opts.onNext?.();
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          opts.onPrev?.();
          break;
        case "o":
        case "Enter":
          e.preventDefault();
          opts.onOpen?.();
          break;
        case "f":
        case "/":
          if (e.key === "/" && !e.shiftKey) {
            e.preventDefault();
            opts.onSearch?.();
          }
          break;
        case "b":
          e.preventDefault();
          opts.onToggleBriefing?.();
          break;
        case "c":
          e.preventDefault();
          opts.onToggleCategory?.();
          break;
        case "?":
          e.preventDefault();
          // Handled by CommandPalette
          break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [opts]);
}

export function CommandPalette({
  onClose,
  onSearch,
  onNavigate,
}: {
  onClose: () => void;
  onSearch: () => void;
  onNavigate: (path: string) => void;
}) {
  const [query, setQuery] = useState("");

  const actions = [
    { key: "b", label: "Toggle Briefing/Full Feed", action: () => { onClose(); document.querySelector("[data-briefing-toggle]")?.dispatchEvent(new Event("click", { bubbles: true })); } },
    { key: "f", label: "Focus Search", action: () => { onClose(); onSearch(); } },
    { key: "c", label: "Cycle Category Filter", action: () => { onClose(); document.querySelector("[data-category-toggle]")?.dispatchEvent(new Event("click", { bubbles: true })); } },
    { key: "g", label: "Go to Knowledge Graph", action: () => { onClose(); onNavigate("/news/graph"); } },
    { key: "a", label: "Ask AI about News", action: () => { onClose(); onNavigate("/news/chat"); } },
    { key: "h", label: "My Channels", action: () => { onClose(); onNavigate("/news/channels"); } },
    { key: "r", label: "Archive", action: () => { onClose(); onNavigate("/news/archive"); } },
  ];

  const filtered = query
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  useEffect(() => {
    function escHandler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-xl border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          type="text"
          placeholder="Type a command or search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-t-xl border-b bg-transparent px-4 py-3 text-sm outline-none"
        />
        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.map((action) => (
            <button
              key={action.key}
              onClick={action.action}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
            >
              <kbd className="shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted">
                {action.key}
              </kbd>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        <div className="border-t px-4 py-2 text-[10px] text-muted">
          Press <kbd className="rounded border bg-muted px-1 font-mono">Esc</kbd> to close ·{" "}
          <kbd className="rounded border bg-muted px-1 font-mono">?</kbd> for help
        </div>
      </div>
    </div>
  );
}
