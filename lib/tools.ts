import { FileText, type LucideIcon } from "lucide-react";
import { TextCounter } from "@/components/tools/text-counter";
import type { ComponentType } from "react";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  component: ComponentType;
};

// Add a tool here to expose it on the dashboard and at /tools/<slug>.
export const tools: Tool[] = [
  {
    slug: "text-counter",
    name: "Text counter",
    description: "Count words and characters as you write or edit.",
    icon: FileText,
    component: TextCounter,
  },
];
