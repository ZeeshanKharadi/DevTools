type PrivacyNoticeProps = {
  children: string;
};

export function PrivacyNotice({ children }: PrivacyNoticeProps) {
  return (
    <p className="inline-flex max-w-full items-baseline gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs text-foreground">
      <span className="shrink-0 font-semibold uppercase tracking-wide text-brand">
        Local
      </span>
      <span className="min-w-0 text-pretty">{children}</span>
    </p>
  );
}
