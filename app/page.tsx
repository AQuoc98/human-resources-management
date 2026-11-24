import { ArrowDown, Sparkles } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
      <section className="max-w-3xl">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Sparkles className="size-3.5" aria-hidden="true" /> A little more room to focus</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Practical tools for your workday.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Simple helpers for the everyday tasks that keep people and teams moving.</p>
        <a href="#tools" className="mt-8 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">Explore tools <ArrowDown className="size-4" aria-hidden="true" /></a>
      </section>
      <section id="tools" className="mt-20 scroll-mt-8 sm:mt-28">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2 border-b pb-5"><div><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your toolkit</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">All tools</h2></div><p className="text-sm text-muted-foreground">Choose a tool to get started</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}</div>
      </section>
    </main>
  );
}
