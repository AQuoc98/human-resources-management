"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export function TextCounter() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // A browser may restore a whole page from its back/forward cache.
    const clearText = () => {
      if (textareaRef.current) textareaRef.current.value = "";
      setText("");
    };
    window.addEventListener("pagehide", clearText);
    return () => {
      window.removeEventListener("pagehide", clearText);
      // Next.js may keep a hidden route's component state for Back navigation.
      clearText();
    };
  }, []);
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const characters = Array.from(text).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        {[{ label: "Words", value: words }, { label: "Characters", value: characters }].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <label htmlFor="counter-text" className="text-sm font-medium">Your text</label>
        <Textarea ref={textareaRef} id="counter-text" autoComplete="off" value={text} onChange={(event) => setText(event.target.value)} placeholder="Type or paste your text here…" className="min-h-64 resize-y bg-card p-4 text-base" />
        <p className="text-sm text-muted-foreground">Your text stays in this browser and is cleared when you leave the page.</p>
      </div>
    </div>
  );
}
