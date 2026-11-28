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

export const textCounterTool: Tool = {
  slug: "text-counter",
  name: "Text counter",
  description: "Count words and characters as you write or edit.",
  icon: FileText,
  component: TextCounter,
};

export const tools: Tool[] = [textCounterTool];
