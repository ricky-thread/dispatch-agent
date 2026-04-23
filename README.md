# Auto-Dispatch Prototype — Setup Guide

Admin UI for configuring AI dispatch agents in an MSP platform. Built with React + Tailwind + shadcn/ui.

## Files in this handoff

- `App.jsx` — the full prototype (all UI components + state management)
- `constants.js` — mock data (boards, teams, statuses, hour options, team colors)

## Setting up a new project for Vercel

### 1. Scaffold a Vite + React project

```bash
npm create vite@latest auto-dispatch -- --template react
cd auto-dispatch
npm install
```

### 2. Install Tailwind CSS

Follow the official Tailwind + Vite guide: https://tailwindcss.com/docs/installation/using-vite

```bash
npm install -D tailwindcss @tailwindcss/vite
```

In `vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

In `src/index.css` (replace everything):

```css
@import "tailwindcss";
```

### 3. Install runtime dependencies

```bash
npm install lucide-react
```

### 4. Install shadcn/ui and add the Switch component

```bash
npx shadcn@latest init
npx shadcn@latest add switch
```

This creates `src/components/ui/switch.jsx` (or `.tsx`) which `App.jsx` imports from `@/components/ui/switch`.

### 5. Drop in the prototype files

- Replace `src/App.jsx` with the `App.jsx` from this handoff
- Add `src/constants.js` from this handoff
- Make sure `src/main.jsx` imports `./App` and renders it

### 6. Run locally

```bash
npm run dev
```

### 7. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect the GitHub repo to Vercel through the web dashboard — Vercel auto-detects Vite projects and deploys on push.

## Architecture notes

### State model

All state lives in the top-level `App` component. Agents are stored in a single array with the shape:

```js
{
  id: number,           // Date.now() at creation
  name: string,         // auto-derived from mode + team + board
  mode: "Route" | "Assign" | "Assign + Schedule",
  board: string,        // dispatch-from board
  team: string | null,  // null for Route agents
  destinations: string[], // route destinations (Route mode only)
  active: boolean,
}
```

There's no persistence — refreshing clears the list. Wiring this up to a backend or localStorage is a one-line change in the `useState(agents)` hook and the handlers.

### Constraints

Enforced in `ConfigPage`:

1. Only one Route agent at a time (enforced in `ModeModal` via `hasRouteAgent` prop)
2. One Assign or Assign+Schedule agent per team (assumes 1 team = 1 board)
3. A route rule can't route to the same board the agent monitors

When you later support shared boards (multiple teams on one board), add a "Companies" filter to Agent scope and relax the team uniqueness check — that's the natural next step.

### Known gaps / things to wire up later

- The "Dispatching from ... from 8:00 AM to 6:00 PM" subtitle on Assign cards is hardcoded; it should reflect the agent's actual saved working hours
- "Coming soon" features (SLA risk, Skills match, Client familiarity, Booking link) are visible but non-functional by design
- No persistence layer — reloading loses state
- Time zone is hardcoded to "America/New York"
- No confirmation modal before Delete
- The Sidebar items don't navigate — only "Auto-dispatch" is a real page

## Tailwind content config

If Tailwind isn't picking up classes, confirm your `tailwind.config.js` covers the `src` directory:

```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
};
```

## Troubleshooting

**Icons are missing.** Run `npm install lucide-react`.

**`@/components/ui/switch` import fails.** The path alias isn't set up. Check `vite.config.js` has the `resolve.alias` block for `@`.

**Toggle looks wrong (dot outside the track).** You're using a custom toggle instead of the shadcn `Switch`. Re-run `npx shadcn@latest add switch`.

**Green accent color not showing.** Tailwind isn't scanning `App.jsx`. Check the `content` array in `tailwind.config.js`.
