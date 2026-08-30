import Link from "next/link";
import { getAllTools } from "@/lib/tools/registry";
import { SITE_NAME } from "@/lib/site";
import { Container } from "./Container";

export function Footer() {
  const tools = getAllTools();

  return (
    <footer className="mt-16 border-t border-line bg-panel">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">{SITE_NAME}</p>
          <p className="max-w-sm text-sm text-muted">
            Free developer tools that run in your browser. Your input is not
            uploaded.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="mb-3 text-sm font-semibold text-foreground">Site</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/"
                className="text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/tools"
                className="text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                All tools
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Tools">
          <p className="mb-3 text-sm font-semibold text-foreground">Tools</p>
          <ul className="columns-2 space-y-2 text-sm">
            {tools.map((tool) => (
              <li key={tool.slug} className="break-inside-avoid">
                <Link
                  href={`/tools/${tool.slug}`}
                  className="text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {tool.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container className="border-t border-line py-4">
        <p className="text-xs text-muted">
          Processed locally. No accounts. No tracking of tool input.
        </p>
      </Container>
    </footer>
  );
}
