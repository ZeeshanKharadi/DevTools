import Link from "next/link";
import { AuthNav } from "@/components/auth/AuthNav";
import { SITE_NAME } from "@/lib/site";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "Tools" },
];

export function Header() {
  return (
    <header className="border-b border-line bg-panel/90 backdrop-blur-sm">
      <Container className="flex h-16 min-w-0 items-center justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {SITE_NAME}
          </Link>
          <nav aria-label="Primary" className="min-w-0">
            <ul className="flex items-center gap-3 text-sm sm:gap-4">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <AuthNav />
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
