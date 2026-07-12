"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useNewsKeyboard, CommandPalette } from "./NewsKeyboard";
import { KeyboardHelp } from "./KeyboardHelp";

interface Props {
  children: React.ReactNode;
  cardIds?: string[];
}

export function NewsKeyboardWrapper({ children, cardIds = [] }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [isCmdK, setIsCmdK] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const categoryButtonsRef = useRef<HTMLButtonElement[]>([]);
  const briefingToggleRef = useRef<HTMLButtonElement | null>(null);

  const handleNext = useCallback(() => {
    if (cardIds.length === 0) return;
    setSelectedIndex((prev) => Math.min(prev + 1, cardIds.length - 1));
    const id = cardIds[Math.min(selectedIndex + 1, cardIds.length - 1)];
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [cardIds, selectedIndex]);

  const handlePrev = useCallback(() => {
    if (cardIds.length === 0) return;
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
    const id = cardIds[Math.max(selectedIndex - 1, 0)];
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [cardIds, selectedIndex]);

  const handleOpen = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < cardIds.length) {
      const id = cardIds[selectedIndex];
      const link = document.querySelector(`[data-card-id="${id}"] a, [data-card-id="${id}"] [data-nav-link]`) as HTMLAnchorElement;
      if (link) link.click();
    }
  }, [cardIds, selectedIndex]);

  const handleSearch = useCallback(() => {
    const input = document.querySelector<HTMLInputEvent>('input[type="text"][placeholder*="Search"]');
    input?.focus();
    input?.select();
  }, []);

  useNewsKeyboard({
    onNext: handleNext,
    onPrev: handlePrev,
    onOpen: handleOpen,
    onSearch: handleSearch,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette(true);
        setIsCmdK(true);
      } else if (e.key === "?" && !e.shiftKey && !showPalette && !showHelp) {
        e.preventDefault();
        setShowHelp(true);
      } else if (e.key === "Escape") {
        setShowHelp(false);
        setShowPalette(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showPalette, showHelp]);

  return (
    <>
      {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}
      {showPalette && (
        <CommandPalette
          onClose={() => { setShowPalette(false); setIsCmdK(false); }}
          onSearch={handleSearch}
          onNavigate={(path) => router.push(path)}
        />
      )}
      <div
        data-selected-index={selectedIndex}
        onMouseDown={() => setSelectedIndex(-1)}
      >
        {children}
      </div>
    </>
  );
}
