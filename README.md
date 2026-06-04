# Auto-Dispatch Prototype

Admin UI for configuring AI dispatch agents in an MSP platform. Built with React, Vite, Tailwind CSS, and shadcn/ui.

## Project structure

The runnable app lives in [`auto-dispatch/`](auto-dispatch/):

| Path | Purpose |
|------|---------|
| `auto-dispatch/src/App.jsx` | Main app — agent list, config, sidebar navigation |
| `auto-dispatch/src/constants.js` | Mock data (boards, teams, statuses, route fields) |
| `auto-dispatch/src/components/flows/` | Flows page and super-agent panel |
| `auto-dispatch/src/components/slas/` | SLAs configuration page |
| `auto-dispatch/src/components/test-agent/` | Test panel for agent recommendations |
| `reference/flows-prototype.html` | Original static reference for the Flows visual design |

## Run locally

```bash
cd auto-dispatch
npm install
npm run dev
```

## Build

```bash
cd auto-dispatch
npm run build
```

## Architecture

### Sections

The sidebar navigates between three areas:

- **Auto-dispatch** — create and configure dispatch agents (Route, Assign, Assign + Schedule)
- **Flows** — flow builder UI (static prototype data)
- **SLAs** — SLA rules UI (static prototype data)

### Agent state model

All agent state lives in the top-level `App` component. Agents are stored in memory only — refreshing clears the list.

```js
{
  id: number,
  name: string,
  mode: "Route" | "Assign" | "Assign + Schedule",
  dispatchMode: "Auto-assign" | "Self-serve",  // Assign modes only
  board: string,
  boards: string[],
  team: string | null,
  teams: string[],
  teamScopes: object[],   // per-team scope, filters, and statuses
  routeRules: object[],   // Route mode only
  rankingSignals: object[], // Self-serve mode only
  active: boolean,
}
```

### Constraints (Auto-dispatch)

1. Only one Route agent at a time
2. One Assign or Assign + Schedule agent per team (1 team = 1 board)
3. A routing rule cannot route to the same board it monitors

### Prototype limitations

- No persistence layer
- Sidebar items other than the three main sections are non-functional
- "Coming soon" features (e.g. Booking link) are visible but non-functional
- Working hours subtitle on agent cards is hardcoded
