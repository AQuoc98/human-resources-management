import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Tool } from "@/lib/tools";

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <Link href={`/tools/${tool.slug}`} className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background">
      <Card className="h-full transition-all group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-foreground/25">
        <CardContent className="flex h-full flex-col gap-6 p-6">
          <div className="flex items-start justify-between">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-5" aria-hidden="true" /></span>
            <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
          </div>
          <div className="space-y-2"><h3 className="text-lg font-semibold">{tool.name}</h3><p className="leading-relaxed text-muted-foreground">{tool.description}</p></div>
          <span className="mt-auto text-sm font-medium">Open tool <span aria-hidden="true">→</span></span>
        </CardContent>
      </Card>
    </Link>
  );
}
