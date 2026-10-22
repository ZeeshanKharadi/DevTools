"use client";

import { Feedback } from "@/components/ui/Feedback";

type PdfProcessingStatusProps = {
  message: string | null;
  tone?: "empty" | "success" | "error";
};

export function PdfProcessingStatus({
  message,
  tone = "empty",
}: PdfProcessingStatusProps) {
  if (!message) {
    return null;
  }
  return (
    <Feedback tone={tone} live>
      {message}
    </Feedback>
  );
}
