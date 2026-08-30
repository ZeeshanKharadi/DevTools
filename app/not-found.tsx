import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-lg text-muted">
        That URL does not match a page or tool. Check the address, or browse
        the tools directory.
      </p>
      <p className="mt-6">
        <Link
          href="/tools"
          className="text-sm font-medium text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          View all tools
        </Link>
      </p>
    </Container>
  );
}
