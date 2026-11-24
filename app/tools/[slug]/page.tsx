import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { tools } from "@/lib/tools";

export function generateStaticParams() {
  return tools.map(({ slug }) => ({ slug }));
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = tools.find((item) => item.slug === slug);
  if (!tool) notFound();
  const Icon = tool.icon;
  const ToolComponent = tool.component;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" /> All tools</Link>
      <div className="mb-10 mt-10 flex items-start gap-4 border-b pb-8"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-5" aria-hidden="true" /></span><div><h1 className="text-3xl font-semibold tracking-tight">{tool.name}</h1><p className="mt-2 text-muted-foreground">{tool.description}</p></div></div>
      <ToolComponent />
    </main>
  );
}
