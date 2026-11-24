# Workday tools

A collection of practical tools for everyday office work, built with Next.js and the existing shadcn/ui components.

## Getting started

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm run build` for a production build and `npm run lint` to check the code.

## Adding a tool

Create a React component for the tool and add its unique slug, name, description, Lucide icon, and component to `lib/tools.ts` and its `tools` array. Add `app/tools/<slug>/page.tsx` using the registered tool and the shared `ToolPage` component, following the text counter route. The folder name must match the registered slug. Use a client component when the tool needs browser interactivity.

The text counter runs locally in the browser. Words are separated by whitespace; characters include spaces and line breaks. Text is not saved and is cleared when the tool is left.
