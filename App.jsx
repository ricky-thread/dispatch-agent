/**
 * Auto-Dispatch Configuration Prototype
 * ------------------------------------
 * Admin UI for configuring AI dispatch agents in an MSP platform.
 *
 * Three agent modes:
 *  - Route:             Monitor an intake board, route tickets to the right team's board.
 *  - Assign:            Pick the right technician on a team based on workload/availability.
 *  - Assign + Schedule: Assign a tech AND place the work on their calendar.
 *
 * Constraints enforced in this prototype:
 *  - Only one Route agent can exist at a time.
 *  - One Assign/Assign+Schedule agent per team (covers the 1 team = 1 board assumption).
 *  - A routing rule can't route to the same board it's routing from.
 *
 * Dependencies:
 *  - React
 *  - Tailwind CSS
 *  - lucide-react (icons)
 *  - shadcn/ui Switch component at "@/components/ui/switch"
 */

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Activity,
  Building2,
  CalendarClock,
  Check,
  CheckSquare,
  ChevronDown,
  Copy,
  Globe,
  HelpCircle,
  Inbox,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Plug,
  Plus,
  Settings,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Star,
  Target,
  Trash2,
  Users,
  UserPlus,
  Wallet,
  Wand2,
  Workflow,
  Zap,
} from "lucide-react";

import {
  BOARDS,
  TEAMS,
  STATUSES,
  HOUR_OPTIONS,
  TEAM_COLORS,
} from "./constants";

// =============================================================================
// SHARED PRIMITIVES
// =============================================================================

function Select({
  value,
  options,
  onChange,
  className = "",
  placeholder = "Select",
}) {
  const [open, setOpen] = useState(false);
  const isEmpty = !value;
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center justify-between gap-2 min-w-[140px] px-3 py-1.5 bg-white border border-neutral-200 rounded-md text-sm hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
      >
        <span className={`truncate ${isEmpty ? "text-neutral-400" : "text-neutral-800"}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className="text-neutral-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-full bg-white border border-neutral-200 rounded-md shadow-lg py-1 z-20 max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50 whitespace-nowrap"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelect({ values, options, onChange, placeholder = "Select" }) {
  const [open, setOpen] = useState(false);

  const toggle = (opt) => {
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt));
    } else {
      onChange([...values, opt]);
    }
  };

  const label =
    values.length === 0
      ? placeholder
      : values.length === 1
      ? values[0]
      : `${values.length} selected`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center justify-between gap-2 min-w-[140px] px-3 py-1.5 bg-white border border-neutral-200 rounded-md text-sm text-neutral-800 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
      >
        <span className={`truncate ${values.length === 0 ? "text-neutral-400" : ""}`}>
          {label}
        </span>
        <ChevronDown size={14} className="text-neutral-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-full bg-white border border-neutral-200 rounded-md shadow-lg py-1 z-20">
          {options.map((opt) => {
            const selected = values.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggle(opt);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50 whitespace-nowrap flex items-center gap-2"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    selected
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-white border-neutral-300"
                  }`}
                >
                  {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      className="data-[state=checked]:bg-emerald-500"
    />
  );
}

function Row({ label, subcopy, children, noBorder = false }) {
  return (
    <div
      className={`flex items-start justify-between gap-6 px-5 py-4 ${
        noBorder ? "" : "border-b border-neutral-100"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-900">{label}</div>
        {subcopy && (
          <div className="text-sm text-neutral-500 mt-0.5 leading-snug">{subcopy}</div>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">{children}</div>
    </div>
  );
}

function Section({ title, subcopy, children }) {
  return (
    <div className="mb-10">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        {subcopy && <p className="text-sm text-neutral-500 mt-0.5">{subcopy}</p>}
      </div>
      <div className="bg-white border border-neutral-200 rounded-lg">{children}</div>
    </div>
  );
}

function ComingSoon() {
  return <span className="text-sm text-neutral-400">Coming soon</span>;
}

// =============================================================================
// SIDEBAR
// =============================================================================

function Sidebar({ active = "Auto-dispatch" }) {
  const groups = [
    {
      label: "Magic AI",
      items: [
        { icon: Sparkles, label: "Assistive AI" },
        { icon: Wand2, label: "Magic Agents" },
        { icon: Target, label: "Intelligence" },
      ],
    },
    {
      label: "Automation",
      items: [
        { icon: Workflow, label: "Status automation" },
        { icon: CheckSquare, label: "Flows" },
        { icon: LayoutGrid, label: "Auto-dispatch" },
      ],
    },
    {
      label: "Messenger",
      items: [
        { icon: MessageSquare, label: "Messenger" },
        { icon: Phone, label: "Voice" },
        { icon: Building2, label: "Clients" },
      ],
    },
    {
      label: "General",
      items: [
        { icon: Settings, label: "Workspace" },
        { icon: Target, label: "Plans & licenses" },
        { icon: Users, label: "Members" },
        { icon: Plug, label: "Integrations" },
        { icon: ShieldCheck, label: "Security center" },
        { icon: Activity, label: "Analytics" },
        { icon: Wallet, label: "Partner value" },
        { icon: Star, label: "Feedback" },
      ],
    },
  ];

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-neutral-200 flex flex-col">
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-neutral-900">ACME</div>
          <div className="text-[11px] text-neutral-400 flex items-center gap-0.5">
            Workspace <ChevronDown size={10} />
          </div>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-neutral-600 hover:bg-neutral-50 cursor-pointer">
          <Zap size={15} />
          <span>Get Started</span>
        </div>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <div className="px-3 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
              {g.label}
            </div>
            <div className="space-y-0.5">
              {g.items.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm cursor-pointer ${
                    active === label
                      ? "bg-neutral-100 text-neutral-900 font-medium"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Icon size={15} className="shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-500">
        <div className="flex items-center gap-2">
          <Inbox size={15} />
          <span>Inbox</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HelpCircle size={15} />
          <span>Help</span>
        </div>
      </div>
    </aside>
  );
}

// =============================================================================
// AGENT LIST PAGE
// =============================================================================

function AgentCard({
  agent,
  onOpen,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isRoute = agent.mode === "Route";

  const title = isRoute ? "Routing Agent" : `${agent.team} Dispatch Agent`;
  const subtitle = isRoute
    ? `Dispatching from ${agent.board || "{Board}"}${
        agent.destinations?.length
          ? ` to ${agent.destinations.join(", ")}`
          : ""
      }`
    : `Dispatching from ${agent.board} from 8:00 AM to 6:00 PM`;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-visible">
      {/* Top row: icon, title, toggle */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-neutral-50 rounded-t-xl"
        onClick={onOpen}
      >
        {isRoute ? (
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <Shuffle size={18} className="text-emerald-600" />
          </div>
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              TEAM_COLORS[agent.team] || "bg-neutral-400"
            }`}
          >
            <span className="sr-only">{agent.team}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-neutral-900">{title}</div>
          <div className="text-xs text-neutral-500 mt-0.5 truncate">{subtitle}</div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Toggle
            checked={agent.active}
            onChange={() => onToggleActive(agent.id)}
          />
        </div>
      </div>

      {/* Bottom row: configuration link + more menu */}
      <div className="flex items-center gap-4 px-5 py-3.5 border-t border-neutral-100 bg-neutral-50/40 rounded-b-xl">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpen}>
          <div className="text-sm font-medium text-neutral-900">Configuration</div>
          <div className="text-xs text-neutral-500 mt-0.5">
            Adjust dispatch logic and working hours for this team.
          </div>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 min-w-[160px] bg-white border border-neutral-200 rounded-md shadow-lg py-1 z-30">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  onEdit();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50 flex items-center gap-2"
              >
                <Pencil size={13} className="text-neutral-500" />
                Edit
              </button>
              {!isRoute && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onDuplicate();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <Copy size={13} className="text-neutral-500" />
                  Duplicate
                </button>
              )}
              <div className="my-1 border-t border-neutral-100" />
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  onDelete();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentListPage({
  agents,
  onCreate,
  onOpenAgent,
  onDeleteAgent,
  onDuplicateAgent,
  onToggleActive,
}) {
  const isEmpty = agents.length === 0;

  // Route agent (if any) always sorts first
  const sortedAgents = [...agents].sort((a, b) => {
    if (a.mode === "Route" && b.mode !== "Route") return -1;
    if (b.mode === "Route" && a.mode !== "Route") return 1;
    return 0;
  });

  return (
    <main className="flex-1 bg-gradient-to-b from-white via-white to-emerald-50/40 min-h-screen">
      <header className="px-8 py-4 border-b border-neutral-200 bg-white">
        <h1 className="text-lg font-semibold text-neutral-900">Assistive AI</h1>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-10 h-10 rounded-md bg-emerald-100 flex items-center justify-center mb-4">
            <LayoutGrid size={20} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Auto-dispatch</h2>
          <p className="text-sm text-neutral-500 mt-2 max-w-lg leading-relaxed">
            Auto-dispatch works like a dispatcher on your team — it picks up new tickets and
            assigns them to the right tech based on availability, workload, and priority.
          </p>
          {!isEmpty && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm mt-5"
            >
              <Plus size={15} />
              Create Agent
            </button>
          )}
        </div>

        <div className="border-t border-neutral-200 pt-8">
          {isEmpty ? (
            <div className="border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50/30 py-14 px-6 flex flex-col items-center">
              <div className="text-base font-semibold text-neutral-900">
                No dispatch agents configured
              </div>
              <p className="text-sm text-neutral-500 mt-1.5 mb-6 max-w-sm text-center">
                Set up your first agent and let it handle ticket routing automatically.
              </p>
              <button
                onClick={onCreate}
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-colors"
              >
                <Plus size={15} />
                Create agent
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onOpen={() => onOpenAgent(agent.id)}
                  onEdit={() => onOpenAgent(agent.id)}
                  onDelete={() => onDeleteAgent(agent.id)}
                  onDuplicate={() => onDuplicateAgent(agent.id)}
                  onToggleActive={onToggleActive}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// =============================================================================
// MODE SELECTION MODAL
// =============================================================================

function ModeModal({ onPick, onClose, hasRouteAgent = false }) {
  const allModes = [
    {
      id: "Route",
      icon: Shuffle,
      title: "Route",
      description: "Read incoming tickets and send them to the right team's board.",
    },
    {
      id: "Assign",
      icon: UserPlus,
      title: "Assign",
      description: "Route tickets and assign them to the right technician.",
    },
    {
      id: "Assign + Schedule",
      icon: CalendarClock,
      title: "Assign + Schedule",
      description: "Route, assign, and schedule tickets on a technician's calendar.",
    },
  ];

  const modes = hasRouteAgent ? allModes.filter((m) => m.id !== "Route") : allModes;
  const tierByMode = { Route: 1, Assign: 2, "Assign + Schedule": 3 };

  return (
    <div
      className="fixed inset-0 bg-neutral-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-neutral-100">
          <h2 className="text-base font-semibold text-neutral-900">Create a dispatch agent</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Choose how much of the dispatching work the agent should take on.
          </p>
        </div>
        <div className="p-4 space-y-2">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onPick(m.id)}
                className="w-full text-left flex items-start gap-4 p-4 rounded-lg border border-neutral-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors group"
              >
                <div className="w-9 h-9 rounded-md bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={18} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">{m.title}</span>
                    <span className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
                      Tier {tierByMode[m.id]}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5 leading-snug">{m.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-neutral-100 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-neutral-600 hover:text-neutral-900 px-3 py-1.5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CONFIG PAGE
// =============================================================================

function ConfigPage({
  mode,
  agents = [],
  editingAgentId = null,
  initialAgent = null,
  onBack,
  onSave,
}) {
  const isRoute = mode === "Route";
  const isAssign = mode === "Assign";
  const isSchedule = mode === "Assign + Schedule";

  // --- Agent scope
  const [active, setActive] = useState(initialAgent?.active ?? true);
  const [team, setTeam] = useState(initialAgent?.team ?? null);
  const [board, setBoard] = useState(initialAgent?.board ?? "");
  const [statusMode, setStatusMode] = useState("Include only");
  const [statuses, setStatuses] = useState(["Needs scheduling"]);

  // --- Working hours (Assign + Schedule)
  const [startTime, setStartTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("5:00 PM");
  const [offset, setOffset] = useState("Every 30 min");
  const [scheduleInterval, setScheduleInterval] = useState("Every 15 min");
  const [scheduleWindow, setScheduleWindow] = useState("Today only");
  const [slotSelection, setSlotSelection] = useState("Earliest available");
  const [duration, setDuration] = useState("30 min");

  // --- Assignment logic (Assign + Assign+Schedule)
  const [priority, setPriority] = useState("Highest first");
  const [ticketAge, setTicketAge] = useState("Oldest first");
  const [techSelection, setTechSelection] = useState("Most open time");

  // --- Route mode rules
  const [rules, setRules] = useState(
    initialAgent?.destinations?.length
      ? initialAgent.destinations.map((b, i) => ({ id: i + 1, board: b, prompt: "" }))
      : [{ id: 1, board: "", prompt: "" }]
  );
  const [keepOnBoardPrompt, setKeepOnBoardPrompt] = useState("");

  const addRule = () =>
    setRules((r) => [...r, { id: Date.now(), board: "", prompt: "" }]);
  const updateRule = (id, patch) =>
    setRules((r) => r.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  const removeRule = (id) =>
    setRules((r) => r.filter((rule) => rule.id !== id));

  const rulePlaceholder =
    "Route tickets about hardware orders, vendor management, software purchases, and license renewals here.";

  // ---------------------------------------------------------------------------
  // Conflict detection
  //
  // With the 1 team = 1 board assumption, team uniqueness covers board uniqueness.
  // Relax this rule when we later support shared boards via company/tsi filters.
  // ---------------------------------------------------------------------------
  const otherAgents = agents.filter((a) => a.id !== editingAgentId);

  const teamsWithAssignment = new Map();
  otherAgents
    .filter((a) => a.mode === "Assign" || a.mode === "Assign + Schedule")
    .forEach((a) => teamsWithAssignment.set(a.team, { mode: a.mode, name: a.name }));

  let teamError = null;
  if (team && !isRoute) {
    const clash = teamsWithAssignment.get(team);
    if (clash) {
      if (clash.mode === mode) {
        teamError = `${team} already has an ${mode} agent ("${clash.name}"). Edit that agent instead.`;
      } else {
        teamError = `${team} already has an ${clash.mode} agent ("${clash.name}"). A team can only have one of Assign or Assign + Schedule.`;
      }
    }
  }

  const ruleErrors = {};
  if (isRoute) {
    rules.forEach((rule) => {
      if (!rule.board) return;
      if (rule.board === board) {
        ruleErrors[rule.id] = "Can't route to the same board you're routing from.";
      }
    });
  }

  const hasErrors = !!teamError || Object.keys(ruleErrors).length > 0;
  const missingRequired = !board || (!isRoute && !team);
  const canSave = !hasErrors && !missingRequired;

  const handleSaveClick = () => {
    const derivedName = initialAgent?.name
      ? initialAgent.name
      : isRoute
      ? `Routing agent · ${board}`
      : `${mode} · ${team} · ${board}`;

    onSave({
      name: derivedName,
      mode,
      board,
      team: isRoute ? null : team,
      destinations: isRoute ? rules.map((r) => r.board).filter(Boolean) : [],
      active,
    });
  };

  const headerTitle = initialAgent
    ? initialAgent.name
    : isRoute
    ? "New routing agent"
    : `New ${mode.toLowerCase()} agent`;

  return (
    <main className="flex-1 bg-gradient-to-b from-white via-white to-blue-50/30 min-h-screen">
      <header className="px-6 py-3.5 border-b border-neutral-200 bg-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded hover:bg-neutral-100 text-neutral-500"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-semibold text-neutral-900 truncate">
            {headerTitle}
          </h1>
        </div>
        <Toggle checked={active} onChange={setActive} />
      </header>

      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Route mode intro */}
        {isRoute && (
          <div className="mb-10 pb-8 border-b border-neutral-200">
            <h1 className="text-lg font-semibold text-neutral-900 mb-2">
              How this agent works
            </h1>
            <p className="text-sm text-neutral-600 leading-relaxed">
              When a ticket arrives, the agent reads the{" "}
              <span className="text-neutral-900 font-medium">title</span>,{" "}
              <span className="text-neutral-900 font-medium">summary</span>,{" "}
              <span className="text-neutral-900 font-medium">description</span>, and{" "}
              <span className="text-neutral-900 font-medium">conversation history</span>. It also
              has access to the{" "}
              <span className="text-neutral-900 font-medium">contact</span> and contact type,{" "}
              <span className="text-neutral-900 font-medium">company</span>,{" "}
              <span className="text-neutral-900 font-medium">agreement</span> and agreement type,{" "}
              <span className="text-neutral-900 font-medium">configuration</span> and
              configuration type,{" "}
              <span className="text-neutral-900 font-medium">board</span>,{" "}
              <span className="text-neutral-900 font-medium">priority</span>,{" "}
              <span className="text-neutral-900 font-medium">ticket type/subtype/item</span>, and
              any <span className="text-neutral-900 font-medium">custom fields</span> you've
              configured. Based on the routing rules below, it decides which board the ticket
              belongs on.
            </p>
          </div>
        )}

        {/* Agent scope */}
        <Section
          title="Agent scope"
          subcopy={
            isRoute
              ? "Set the intake board this agent monitors."
              : "Set the team and board this agent monitors."
          }
        >
          {!isRoute && (
            <Row label="Inbox Team" subcopy="Select the team tickets will be dispatched to.">
              <Select
                value={team}
                options={TEAMS}
                onChange={setTeam}
                placeholder="Select team"
                className={teamError ? "ring-2 ring-red-200 rounded-md" : ""}
              />
              {teamError && (
                <div className="text-xs text-red-600 text-right max-w-xs leading-snug mt-1">
                  {teamError}
                </div>
              )}
            </Row>
          )}
          <Row
            label="Dispatch from"
            subcopy={
              isRoute
                ? "Select the intake board to route tickets from."
                : "Select the board to dispatch tickets from."
            }
          >
            <Select
              value={board}
              options={BOARDS}
              onChange={setBoard}
              placeholder="Select board"
            />
          </Row>
          <Row
            label="Status"
            subcopy="Select the statuses the agent should focus on. Statuses excluded from this list won't count toward the agent's workload."
            noBorder
          >
            <div className="flex items-center gap-2">
              <Select
                value={statusMode}
                options={["Include only", "Exclude"]}
                onChange={setStatusMode}
              />
              <MultiSelect
                values={statuses}
                options={STATUSES}
                onChange={setStatuses}
                placeholder="Select statuses"
              />
            </div>
          </Row>
        </Section>

        {/* Route mode: rules */}
        {isRoute && (
          <div className="mb-10">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-neutral-900">Routing rules</h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                Add a rule for each board you want to route tickets to. The agent reads all rules
                together and picks the best fit for each ticket.
              </p>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => {
                const availableBoards = BOARDS.filter(
                  (b) =>
                    b !== board &&
                    (b === rule.board ||
                      !rules.some((r) => r.id !== rule.id && r.board === b))
                );
                const error = ruleErrors[rule.id];
                return (
                  <div
                    key={rule.id}
                    className={`bg-white border rounded-lg ${
                      error ? "border-red-300" : "border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-neutral-50/50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Route to
                        </span>
                        <Select
                          value={rule.board}
                          options={availableBoards}
                          onChange={(b) => updateRule(rule.id, { board: b })}
                        />
                      </div>
                      {rules.length > 1 && (
                        <button
                          onClick={() => removeRule(rule.id)}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Remove rule"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    {error && (
                      <div className="px-5 py-2 text-xs text-red-600 bg-red-50/60 border-b border-red-100 leading-snug">
                        {error}
                      </div>
                    )}
                    <div className="p-1">
                      <textarea
                        value={rule.prompt}
                        onChange={(e) => updateRule(rule.id, { prompt: e.target.value })}
                        placeholder={rulePlaceholder}
                        className="w-full min-h-[100px] p-4 text-sm text-neutral-800 placeholder:text-neutral-400 bg-transparent border-0 focus:outline-none resize-y leading-relaxed"
                      />
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addRule}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1.5"
              >
                <Plus size={14} />
                Add rule
              </button>

              {/* "Keep on this board" default rule */}
              <div className="bg-neutral-50/60 border border-dashed border-neutral-300 rounded-lg overflow-hidden mt-4">
                <div className="flex items-center justify-between px-5 py-3 border-b border-dashed border-neutral-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Keep on this board
                    </span>
                    <span className="text-xs text-neutral-400">(optional)</span>
                  </div>
                  <span className="text-xs text-neutral-400">Default</span>
                </div>
                <div className="p-1">
                  <textarea
                    value={keepOnBoardPrompt}
                    onChange={(e) => setKeepOnBoardPrompt(e.target.value)}
                    placeholder="Describe tickets that shouldn't be routed and should stay on the current board — e.g., general how-to questions, password resets, or anything requiring manual triage."
                    className="w-full min-h-[80px] p-4 text-sm text-neutral-800 placeholder:text-neutral-400 bg-transparent border-0 focus:outline-none resize-y leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Working hours — Assign (hours only) + Assign+Schedule (full) */}
        {!isRoute && (
          <Section
            title={isSchedule ? "Working hours and scheduling" : "Working hours"}
            subcopy={
              isSchedule
                ? "Control the hours and time windows the agent operates within."
                : "Control the hours the agent operates within."
            }
          >
            <Row
              label="Working hours"
              subcopy="The hours during which new tickets will be automatically dispatched to this team. Time zone is pulled from your workspace settings."
              noBorder={!isSchedule}
            >
              <div className="flex items-center gap-2">
                <Select value={startTime} options={HOUR_OPTIONS} onChange={setStartTime} />
                <span className="text-sm text-neutral-500">to</span>
                <Select value={endTime} options={HOUR_OPTIONS} onChange={setEndTime} />
              </div>
              <div className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                <Globe size={11} /> (GMT-5) America/New York
              </div>
            </Row>

            {isSchedule && (
              <>
                <Row
                  label="Schedule offset"
                  subcopy="How far ahead to start scheduling. At 8:15 AM with a 60-min offset, the earliest slot is 9:15 AM."
                >
                  <Select
                    value={offset}
                    options={["Every 15 min", "Every 30 min", "Every 60 min"]}
                    onChange={setOffset}
                  />
                </Row>
                <Row
                  label="Schedule interval"
                  subcopy="The time increments available for scheduling. With a 15-min interval, valid times are :00, :15, :30, and :45."
                >
                  <Select
                    value={scheduleInterval}
                    options={["Every 15 min", "Every 30 min", "Every 60 min"]}
                    onChange={setScheduleInterval}
                  />
                </Row>
                <Row
                  label="Scheduling window"
                  subcopy="How far ahead auto-dispatch will look when finding an open slot."
                >
                  <Select
                    value={scheduleWindow}
                    options={["Today only", "Today and tomorrow", "Next 3 days", "Next 7 days"]}
                    onChange={setScheduleWindow}
                  />
                </Row>
                <Row
                  label="Time slot selection"
                  subcopy="How auto-dispatch picks the time slot within a tech's day."
                >
                  <Select
                    value={slotSelection}
                    options={["Earliest available", "Latest available"]}
                    onChange={setSlotSelection}
                  />
                </Row>
                <Row
                  label="Event duration"
                  subcopy="The default time block added to a tech's calendar when a ticket is assigned."
                >
                  <Select
                    value={duration}
                    options={["15 min", "30 min", "45 min", "60 min"]}
                    onChange={setDuration}
                  />
                </Row>
                <Row
                  label="Booking link"
                  subcopy="When enabled, the agent will send clients a booking link and coordinate meetings with team members."
                  noBorder
                >
                  <ComingSoon />
                </Row>
              </>
            )}
          </Section>
        )}

        {/* Assignment logic — Assign + Assign+Schedule */}
        {!isRoute && (
          <Section
            title="Assignment logic"
            subcopy={
              isSchedule
                ? "Define how the agent picks the right tech and schedules the work."
                : "Define how the agent picks the right tech."
            }
          >
            <Row label="Priority" subcopy="Assign tickets in order of priority.">
              <Select
                value={priority}
                options={["Highest first", "Lowest first"]}
                onChange={setPriority}
              />
            </Row>
            <Row
              label="Ticket age"
              subcopy="Prioritize tickets that have been waiting the longest."
            >
              <Select
                value={ticketAge}
                options={["Oldest first", "Newest first"]}
                onChange={setTicketAge}
              />
            </Row>
            <Row
              label="Tech selection"
              subcopy="How the agent determines which technician to assign work to."
            >
              <Select
                value={techSelection}
                options={["Most open time", "Fewest tickets assigned", "Round robin"]}
                onChange={setTechSelection}
              />
            </Row>
            <Row
              label="SLA risk"
              subcopy="Prioritize tickets closest to breaching their SLA first."
            >
              <ComingSoon />
            </Row>
            <Row
              label="Skills match"
              subcopy="Match the ticket category to a technician's skillset."
            >
              <span className="text-sm text-neutral-400">TBD</span>
            </Row>
            <Row
              label="Client familiarity"
              subcopy="Favor technicians who have worked with this client before."
              noBorder
            >
              <span className="text-sm text-neutral-400">TBD</span>
            </Row>
          </Section>
        )}

        {/* Save / Cancel */}
        <div className="flex flex-col items-end gap-2 pb-12">
          {hasErrors && (
            <div className="text-xs text-red-600">
              Resolve the highlighted conflicts before saving.
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="text-sm text-neutral-600 hover:text-neutral-900 px-4 py-2"
            >
              Cancel
            </button>
            <button
              disabled={!canSave}
              onClick={handleSaveClick}
              className={`inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2 rounded-md shadow-sm ${
                !canSave
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              <Check size={14} />
              Save
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// =============================================================================
// ROOT
// =============================================================================

export default function App() {
  const [view, setView] = useState("list"); // "list" | "config"
  const [mode, setMode] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [editingAgentId, setEditingAgentId] = useState(null);

  const handlePickMode = (m) => {
    setMode(m);
    setModalOpen(false);
    setEditingAgentId(null);
    setView("config");
  };

  const handleSave = (agent) => {
    if (editingAgentId) {
      setAgents((prev) =>
        prev.map((a) => (a.id === editingAgentId ? { ...a, ...agent } : a))
      );
    } else {
      setAgents((prev) => [...prev, { id: Date.now(), ...agent }]);
    }
    setView("list");
    setEditingAgentId(null);
  };

  const handleOpenAgent = (id) => {
    const a = agents.find((x) => x.id === id);
    if (!a) return;
    setMode(a.mode);
    setEditingAgentId(id);
    setView("config");
  };

  const handleDeleteAgent = (id) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDuplicateAgent = (id) => {
    const source = agents.find((a) => a.id === id);
    if (!source) return;

    // Drop the user into a blank-scope copy so they can pick new team/board
    const duplicate = {
      ...source,
      id: Date.now(),
      name: `${source.name} (copy)`,
      team: null,
      board: "",
      active: false,
    };
    setAgents((prev) => [...prev, duplicate]);
    setMode(source.mode);
    setEditingAgentId(duplicate.id);
    setView("config");
  };

  const handleToggleActive = (id) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const editingAgent = editingAgentId
    ? agents.find((a) => a.id === editingAgentId) || null
    : null;

  return (
    <div
      className="min-h-screen flex font-sans text-neutral-900 bg-neutral-50"
      style={{
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <Sidebar />

      {view === "list" && (
        <AgentListPage
          agents={agents}
          onCreate={() => setModalOpen(true)}
          onOpenAgent={handleOpenAgent}
          onDeleteAgent={handleDeleteAgent}
          onDuplicateAgent={handleDuplicateAgent}
          onToggleActive={handleToggleActive}
        />
      )}

      {view === "config" && mode && (
        <ConfigPage
          mode={mode}
          agents={agents}
          editingAgentId={editingAgentId}
          initialAgent={editingAgent}
          onBack={() => {
            setView("list");
            setEditingAgentId(null);
          }}
          onSave={handleSave}
        />
      )}

      {modalOpen && (
        <ModeModal
          onPick={handlePickMode}
          onClose={() => setModalOpen(false)}
          hasRouteAgent={agents.some((a) => a.mode === "Route")}
        />
      )}
    </div>
  );
}
