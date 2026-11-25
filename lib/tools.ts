import { FileText, ContactRound, type LucideIcon } from "lucide-react";
import { CitizenIdExtractor } from "@/components/tools/citizen-id-extractor";
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

export const citizenIdTool: Tool = { slug: "citizen-id", name: "Citizen ID information extractor", description: "Extract and review ID details locally in your browser.", icon: ContactRound, component: CitizenIdExtractor };

export const tools: Tool[] = [textCounterTool, citizenIdTool];
