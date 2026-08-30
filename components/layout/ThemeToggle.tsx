"use client";

import { THEME_PREFERENCES, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/cn";
import { useTheme } from "./ThemeProvider";

const labels: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex rounded-md border border-line bg-panel p-0.5"
    >
      {THEME_PREFERENCES.map((option) => {
        const selected = preference === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => setPreference(option)}
            aria-pressed={selected}
            className={cn(
              "rounded px-2 py-1 text-xs font-medium text-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              selected && "bg-canvas text-foreground",
            )}
          >
            {labels[option]}
          </button>
        );
      })}
    </div>
  );
}
