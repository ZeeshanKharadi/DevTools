import { ToolSearch } from "./ToolSearch";
import type { Tool } from "@/lib/tools/types";

type HeroProps = {
  tools: readonly Tool[];
};

export function Hero({ tools }: HeroProps) {
  return (
    <section className="space-y-6 py-10 sm:py-14">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Free Online Developer Tools
        </h1>
        <p className="text-lg text-muted">
          Fast, simple and privacy-friendly tools for developers.
        </p>
      </div>
      <ToolSearch tools={tools} />
    </section>
  );
}
