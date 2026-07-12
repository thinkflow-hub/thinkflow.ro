"use client";

export function KeyboardHelp({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: "j / ↓", desc: "Navigate to next article" },
    { key: "k / ↑", desc: "Navigate to previous article" },
    { key: "o / Enter", desc: "Open selected article" },
    { key: "f / /", desc: "Focus search bar" },
    { key: "b", desc: "Toggle Briefing / Full Feed" },
    { key: "c", desc: "Cycle category filter" },
    { key: "⌘K", desc: "Open command palette" },
    { key: "?", desc: "Show this help" },
    { key: "Esc", desc: "Close modals / search" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-sm">
              <kbd className="rounded border bg-muted px-2 py-0.5 text-xs font-mono">{s.key}</kbd>
              <span className="text-muted">{s.desc}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-muted py-2 text-sm hover:bg-muted/80 transition-colors"
        >
          Close (Esc)
        </button>
      </div>
    </div>
  );
}
