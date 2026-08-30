import Link from "next/link";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

type BreadcrumbsProps = {
  items: readonly BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          {items.map((item, index) => {
            const last = index === items.length - 1;

            return (
              <li key={item.path} className="flex items-center gap-1">
                {index > 0 ? (
                  <span aria-hidden="true" className="px-1">
                    /
                  </span>
                ) : null}
                {last ? (
                  <span aria-current="page" className="text-foreground">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
