# Workday tools

A collection of practical tools for everyday office work, built with Next.js and the existing shadcn/ui components.

## Getting started

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm run build` for a production build and `npm run lint` to check the code.

## Adding a tool

Create a React component for the tool and add its unique slug, name, description, Lucide icon, and component to `lib/tools.ts`. The registry supplies both the dashboard card and the `/tools/<slug>` route. Use a client component when the tool needs browser interactivity.

The text counter runs locally in the browser. Words are separated by whitespace; characters include spaces and line breaks. Text is not saved and is cleared when the tool is left.
