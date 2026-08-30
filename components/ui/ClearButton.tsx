"use client";

import { Button } from "./Button";

type ClearButtonProps = {
  onClear: () => void;
  disabled?: boolean;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function ClearButton({
  onClear,
  disabled,
  label = "Clear",
  variant = "secondary",
  className,
}: ClearButtonProps) {
  return (
    <Button
      onClick={onClear}
      disabled={disabled}
      variant={variant}
      className={className}
    >
      {label}
    </Button>
  );
}
