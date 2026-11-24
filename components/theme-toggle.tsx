"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  function toggleTheme() {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* Theme still works for this session. */ }
  }

  return (
    <Button variant="outline" size="icon-lg" onClick={toggleTheme} aria-label="Toggle light and dark theme" title="Toggle theme">
      <Moon className="dark:hidden" aria-hidden="true" /><Sun className="hidden dark:block" aria-hidden="true" />
    </Button>
  );
}
