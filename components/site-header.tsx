import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <nav aria-label="Main navigation" className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-md font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><LayoutGrid className="size-4" aria-hidden="true" /></span>
          <span>Workday tools</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6"><Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">All tools</Link><ThemeToggle /></div>
      </nav>
    </header>
  );
}
