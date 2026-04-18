"use client";

import {
  MapPin,
  ChevronDown,
  Palette,
  SearchIcon,
  Loader2Icon,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface MapTheme {
  id: string;
  label: string;
  emoji: string;
  url: string;
  attribution: string;
}

interface HeaderProps {
  query: string;
  onSearch: (value: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  showDropdown: boolean;
  onSelect: (result: SearchResult) => void;
  onFocus: () => void;
  themes: MapTheme[];
  activeTheme: MapTheme;
  onThemeChange: (theme: MapTheme) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Header({
  query,
  onSearch,
  results,
  isSearching,
  showDropdown,
  onSelect,
  onFocus,
  themes,
  activeTheme,
  onThemeChange,
}: HeaderProps) {
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close theme dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-9999 w-[95vw] max-w-3xl">
      <div
        className={cn(
          "flex items-center gap-8 px-6 py-4",
          "bg-white/75",
          "backdrop-blur-2xl backdrop-saturate-150",
          "border-2 border-black",
          "rounded-2xl",
          "shadow-[0_10px_40px_rgba(0,0,0,0.4)]",
          "transition-all duration-300",
        )}
      >
        {/* ── Logo ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0 select-none cursor-default group">
          <Logo />
        </div>

        {/* ── Search ────────────────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0" ref={searchRef}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            {isSearching && (
              <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground animate-spin pointer-events-none" />
            )}
            <Input
              type="text"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              onFocus={onFocus}
              placeholder="Search any place…"
              className={cn(
                "px-9 h-9 text-sm",
                // 'bg-neutral-100/60 dark:bg-white/5',
                "border-zinc-500 border-2",
                "focus-visible:ring-violet-500/30 focus-visible:border-violet-400/50",
              )}
            />
          </div>

          {/* Search dropdown */}
          {showDropdown && results.length > 0 && (
            <div
              className={cn(
                "absolute top-[calc(100%+8px)] left-0 right-0",
                "bg-white/90 dark:bg-neutral-900/90",
                "backdrop-blur-2xl backdrop-saturate-150",
                "border border-neutral-200/50 dark:border-white/10",
                "rounded-xl shadow-xl shadow-black/10",
                "max-h-60 overflow-y-auto",
                "animate-in fade-in-0 slide-in-from-top-2 duration-200",
              )}
            >
              {results.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  onClick={() => onSelect(r)}
                  className={cn(
                    "flex items-start gap-2.5 w-full px-3.5 py-2.5 text-left",
                    "text-[13px] leading-snug text-foreground",
                    "hover:bg-violet-50/60 dark:hover:bg-white/5",
                    "transition-colors duration-150",
                    "border-b border-neutral-100/50 last:border-b-0",
                  )}
                >
                  <MapPin className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Theme Selector ────────────────────────────────────────── */}
        <div className="relative shrink-0" ref={themeRef}>
          <Button
            variant="destructive"
            size="lg"
            onClick={() => setThemeOpen((prev) => !prev)}
          >
            <Palette className="size-4 text-violet-500" />
            <span className="hidden sm:inline text-foreground/80">
              {activeTheme.emoji} {activeTheme.label}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-200",
                themeOpen && "rotate-180",
              )}
            />
          </Button>

          {themeOpen && (
            <div
              className={cn(
                "absolute top-[calc(100%+8px)] right-0",
                "w-44 space-y-2",
                "bg-white/90 dark:bg-neutral-900/90",
                "backdrop-blur-2xl backdrop-saturate-150",
                "border border-neutral-200/50 dark:border-white/10",
                "rounded-xl shadow-xl shadow-black/10",
                "p-3",
                "animate-in fade-in-0 slide-in-from-top-2 duration-200",
              )}
            >
              {themes.map((theme) => (
                <Button
                  key={theme.id}
                  variant={"outline"}
                  onClick={() => {
                    onThemeChange(theme);
                    setThemeOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-start gap-2.5 w-full py-2",
                    "transition-all duration-150",
                    activeTheme.id === theme.id
                      ? "bg-violet-200 text-violet-900 "
                      : "text-foreground/80 hover:bg-neutral-100/60 dark:hover:bg-white/5",
                  )}
                >
                  <span className="text-base">{theme.emoji}</span>
                  <span>{theme.label}</span>
                  {activeTheme.id === theme.id && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-900" />
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
