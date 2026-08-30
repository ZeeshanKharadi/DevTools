"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

type CopyButtonProps = {
  value: string;
  label?: string;
};

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    setError(null);

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setError("Could not copy to the clipboard.");
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button onClick={handleCopy} disabled={!value}>
        {copied ? "Copied" : label}
      </Button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard." : ""}
      </span>
      {error ? (
        <span className="text-xs text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
