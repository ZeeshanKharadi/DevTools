"use client";

import { useId, useMemo, useState } from "react";
import { ToolCard } from "@/components/tools/ToolCard";
import { Input } from "@/components/ui/Input";
import { searchTools } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";

type ToolSearchProps = {
  tools: readonly Tool[];
};

export function ToolSearch({ tools }: ToolSearchProps) {
  const inputId = useId();
  const resultsId = useId();
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchTools(query, tools),
    [query, tools],
  );

  const searching = query.trim().length > 0;

  return (
    <div className="space-y-4">
      <div role="search" className="space-y-2">
        <label htmlFor={inputId} className="sr-only">
          Search developer tools
        </label>
        <Input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools — try jwt, token, encode, epoch"
          autoComplete="off"
          spellCheck={false}
          aria-controls={searching ? resultsId : undefined}
        />
        <p className="text-xs text-muted">
          Search by name, description, keyword, or category. Nothing is sent to
          a server.
        </p>
      </div>

      {searching ? (
        <div id={resultsId} role="region" aria-live="polite" aria-label="Search results">
          {results.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {results.map((tool) => (
                <li key={tool.slug}>
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-line bg-panel px-4 py-6 text-sm text-muted">
              No tools match “{query.trim()}”. Try another word, or browse all
              tools below.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
