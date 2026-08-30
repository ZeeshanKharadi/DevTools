import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeScript() {
  const script = `(() => {try {const key = ${JSON.stringify(THEME_STORAGE_KEY)}; const stored = localStorage.getItem(key); const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system"; const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches); document.documentElement.classList.toggle("dark", dark); document.documentElement.style.colorScheme = dark ? "dark" : "light";} catch {}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
