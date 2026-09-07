import { PARENT_BRAND, PARENT_BRAND_URL, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/cn";

type ParentBrandLineProps = {
  className?: string;
};

export function ParentBrandLine({ className }: ParentBrandLineProps) {
  return (
    <p className={cn("text-sm text-muted", className)}>
      {SITE_NAME} is a product of{" "}
      <a
        href={PARENT_BRAND_URL}
        className="font-medium text-foreground underline-offset-4 hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      >
        {PARENT_BRAND}
      </a>
      .
    </p>
  );
}
