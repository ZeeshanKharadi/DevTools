import Link from "next/link";
import type { Category } from "@/lib/tools/types";
import type { Tool } from "@/lib/tools/types";

type CategoryListProps = {
  categories: readonly Category[];
  tools: readonly Tool[];
};

export function CategoryList({ categories, tools }: CategoryListProps) {
  return (
    <section aria-labelledby="categories-heading" className="space-y-4">
      <h2
        id="categories-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Categories
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const count = tools.filter(
            (tool) => tool.category === category.id,
          ).length;

          return (
            <li key={category.id}>
              <Link
                href={`/tools#${category.id}`}
                className="block rounded-xl border border-line bg-panel p-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {category.label}
                </h3>
                <p className="mt-2 text-sm text-muted">{category.description}</p>
                <p className="mt-3 text-xs text-muted">
                  {count} {count === 1 ? "tool" : "tools"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
