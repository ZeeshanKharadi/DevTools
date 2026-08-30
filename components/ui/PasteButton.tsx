"use client";

import { useState } from "react";
import { Button } from "./Button";

type PasteButtonProps = {
  onPaste: (value: string) => void;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function PasteButton({
  onPaste,
  label = "Paste",
  variant = "secondary",
}: PasteButtonProps) {
  const [error, setError] = useState<string | null>(null);

  async function handlePaste() {
    setError(null);

    try {
      const text = await navigator.clipboard.readText();
      onPaste(text);
    } catch {
      setError("Could not read the clipboard. Paste with Ctrl+V or Cmd+V instead.");
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button onClick={handlePaste} variant={variant}>
        {label}
      </Button>
      {error ? (
        <span className="max-w-xs text-xs text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
