const points = [
  {
    title: "Free",
    body: "Use the tools without an account or payment.",
  },
  {
    title: "Fast",
    body: "Pages are static. Each tool loads only what it needs.",
  },
  {
    title: "Browser-based",
    body: "Work happens on this page after it loads. No install.",
  },
  {
    title: "Privacy-focused",
    body: "Tool input stays in your browser. It is not uploaded.",
  },
];

export function PlatformIntro() {
  return (
    <section aria-labelledby="platform-heading" className="space-y-4">
      <h2 id="platform-heading" className="text-xl font-semibold tracking-tight">
        How this site works
      </h2>
      <p className="max-w-2xl text-sm text-muted">
        InfyraTools is a small set of utilities for everyday development work.
        Processing stays on your device whenever the tool can run locally.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {points.map((point) => (
          <li
            key={point.title}
            className="rounded-xl border border-line bg-panel p-5"
          >
            <h3 className="text-sm font-semibold text-foreground">
              {point.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{point.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
