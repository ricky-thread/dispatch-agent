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

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FlowsPage from "./components/flows/FlowsPage";
import SlasPage from "./components/slas/SlasPage";
import TestAgentPanel from "./components/test-agent/TestAgentPanel";
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  Briefcase,
  Building2,
  Check,
  CheckSquare,
  ChevronDown,
  File,
  FileText,
  Flag,
  Folder,
  Globe,
  Inbox,
  Info,
  Lock,
  MessageSquare,
  ListOrdered,
  MoreHorizontal,
  Package,
  Pencil,
  Play,
  Phone,
  Plug,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Target,
  Trash2,
  ArrowUpRight,
  Users,
  Wallet,
  Wand2,
  X,
  Zap,
  RotateCcw,
  Search,
  Shuffle,
  Clock,
  CalendarDays,
  User,
  ListChecks,
} from "lucide-react";

import {
  BOARDS,
  BOARD_DISPATCH_STATUSES,
  PRODUCTION_BOARD_STATUSES,
  MAX_ACTIVE_THREADS_OPTIONS,
  STATUSES,
  TEAMS,
  TECHS,
  TECH_NAMES,
  HOUR_OPTIONS,
  ROUTE_CONDITION_FIELDS,
  ROUTE_CONDITION_VALUES,
} from "./constants";
import TeamIcon, { TeamLabel } from "./components/TeamIcon";

/** Status menus: default dropdown height + 200px */
const STATUS_MENU_MAX_HEIGHT = "min(46.5rem, calc(100vh - 6rem))";

const DEFAULT_ASSIGN_AGENT_INSTRUCTIONS = `Prioritize tickets in the following order:
1. VIP contacts should always be ranked first, regardless of ticket priority or age.
2. Tickets with unanswered customer replies should rank above tickets with no recent activity.
3. Rank higher priority tickets above lower priority ones when contact type is equal.
4. When priority and reply status are equal, older tickets rank first.

Custom rules:
- Tickets from managed services agreements should rank above break fix tickets of equal priority.`;

function formatLastSaved(date) {
  const datePart = date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `Last saved on ${datePart} at ${timePart}`;
}

function formatExcludedTechsWarning(orphanedNames) {
  if (orphanedNames.length === 0) return null;
  if (orphanedNames.length === 1) {
    return `${orphanedNames[0]} is not on any of the selected teams and will be skipped during dispatch.`;
  }
  if (orphanedNames.length === 2) {
    return `${orphanedNames[0]} and ${orphanedNames[1]} are not on any of the selected teams and will be skipped during dispatch.`;
  }
  const remaining = orphanedNames.length - 2;
  return `${orphanedNames[0]}, ${orphanedNames[1]} and ${remaining} other${
    remaining === 1 ? "" : "s"
  } are not on any of the selected teams and will be skipped during dispatch.`;
}

const SCOPE_BOARD_OPTIONS = [
  "BoardIsmoil",
  "BriannaBoard",
  "Help Desk",
  "Integration",
  "Procurement",
  "Professional Services",
  "Projects-2-10",
  "Projects-2-13",
  "Projects-2-14",
  "Projects-2-15",
];
const SCOPE_DROPDOWN_MIN_WIDTH = 200;

function scopeBoardStatusLabel(board) {
  return `${board} dispatch status`;
}

function ScopeNestedGroup({ children, className = "" }) {
  return (
    <div className={`mt-4 space-y-4 border-l border-neutral-200 pl-4 ${className}`.trim()}>
      {children}
    </div>
  );
}
const COMPANY_TYPE_OPTIONS = [
  "At Risk",
  "Competition",
  "Customer",
  "Not-a-fit",
  "Owner",
  "Partner",
  "Prospect",
  "Suspect",
];

const SCOPE_FILTER_METADATA = {
  "Agreement Type": {
    icon: File,
    values: [
      "Block Time - One time",
      "Block Time - Recurring",
      "Managed Service",
      "Monitoring",
      "Time and materials",
    ],
  },
  Companies: {
    icon: Building2,
    values: [
      "Acme Manufacturing",
      "Brightline Schools",
      "Harbor Hospitality",
      "Northstar Health",
      "Oceanic Logistics",
      "Redwood Legal Group",
      "Summit Retail",
      "Zenith Finance",
    ],
  },
  "Company Type": {
    icon: Folder,
    values: COMPANY_TYPE_OPTIONS,
  },
  Priority: {
    icon: Flag,
    values: ["Critical", "High", "Medium", "Low"],
  },
  "Resource Team": {
    icon: Users,
    values: ["Team A", "Team A - L1"],
  },
  Source: {
    icon: MessageSquare,
    values: [
      "Attendant Phone",
      "Automate",
      "Chatgenie Messenger",
      "Email",
      "Internal",
      "Overflow Phone",
      "Phone",
      "Thread Messenger",
    ],
  },
  Status: {
    icon: CheckSquare,
    values: [...PRODUCTION_BOARD_STATUSES],
  },
  "Sub Type": {
    icon: Folder,
    values: ["Access", "Hardware", "Network", "Software"],
  },
  Type: {
    icon: Folder,
    values: ["Change", "Incident", "Problem", "Service Request"],
  },
};
const SCOPE_FILTER_OPTIONS = Object.keys(SCOPE_FILTER_METADATA);

const normalizeSelections = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
};

function getScopeViews(scope) {
  return normalizeSelections(scope.views ?? scope.view ?? scope.boards ?? scope.board);
}

/** Avatar swatches for the agent identity picker (IDs persisted on saved agents). */
const AGENT_AVATAR_PRESETS = [
  { id: "avatar-1", swatch: "bg-gradient-to-br from-sky-400 to-emerald-500" },
  { id: "avatar-2", swatch: "bg-gradient-to-br from-violet-500 to-fuchsia-500" },
  { id: "avatar-3", swatch: "bg-gradient-to-br from-amber-400 to-orange-500" },
  { id: "avatar-4", swatch: "bg-gradient-to-br from-cyan-400 to-blue-600" },
  { id: "avatar-5", swatch: "bg-gradient-to-br from-rose-400 to-red-500" },
  { id: "avatar-6", swatch: "bg-gradient-to-br from-emerald-300 to-emerald-600" },
];

function avatarSwatchClass(avatarId) {
  const preset = AGENT_AVATAR_PRESETS.find((a) => a.id === avatarId);
  return preset?.swatch ?? AGENT_AVATAR_PRESETS[0].swatch;
}

function newConditionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// =============================================================================
// SHARED PRIMITIVES
// =============================================================================

function DropdownMenuSearch({ inputRef, value, onChange, placeholder = "Find..." }) {
  return (
    <div className="sticky top-0 z-10 w-full min-w-0 shrink-0 overflow-hidden border-b border-neutral-200 bg-white px-3 py-2.5 box-border">
      <div className="flex w-full min-w-0 items-center gap-2">
        <Search size={14} className="shrink-0 text-neutral-400" strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}

function Select({
  value,
  options,
  onChange,
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  placeholder = "Select",
  searchable = false,
  searchPlaceholder = "Find...",
  menuMaxHeight,
  menuWidth,
  menuMinWidth,
  disabledClaims = {},
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const isEmpty = !value;
  const resolvedMenuWidth = (triggerWidth) =>
    menuMinWidth
      ? Math.max(menuWidth ?? triggerWidth, menuMinWidth)
      : menuWidth ?? triggerWidth;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = searchable
    ? options.filter((opt) => opt.toLowerCase().includes(normalizedQuery))
    : options;

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width,
    });
  };

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return undefined;
    }
    updateMenuPosition();
    const handleOutsideClick = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleReposition = () => updateMenuPosition();
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open || !searchable) return;
    searchInputRef.current?.focus();
  }, [open, searchable]);

  const dropdownMenu =
    open && menuPosition ? (
      <div
        ref={menuRef}
        className={`fixed z-[200] min-w-0 overflow-x-hidden overflow-y-auto bg-white border border-neutral-200 rounded-md shadow-lg py-1 ${menuMaxHeight ? "" : "max-h-64"} ${dropdownClassName}`}
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          width: resolvedMenuWidth(menuPosition.minWidth),
          ...(menuMaxHeight ? { maxHeight: menuMaxHeight } : undefined),
        }}
      >
        {searchable ? (
          <DropdownMenuSearch
            inputRef={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
          />
        ) : null}
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-2 text-sm text-neutral-500">No matches found</div>
        ) : (
          filteredOptions.map((opt) => {
            const usedByAgentName = disabledClaims?.[opt];
            const optionDisabled = Boolean(usedByAgentName);
            if (optionDisabled) {
              return (
                <TooltipProvider key={opt} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-neutral-400 cursor-not-allowed whitespace-nowrap">
                        <span className="min-w-0 flex-1 truncate">{opt}</span>
                        <Lock size={13} className="shrink-0 text-neutral-400" strokeWidth={2} aria-hidden />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">
                      Used by {usedByAgentName}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
            return (
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
            );
          })
        )}
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={`relative overflow-visible ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 max-w-[220px] whitespace-nowrap px-3 py-1.5 bg-white border border-neutral-200 rounded-md text-sm ${
          disabled
            ? "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400"
            : "hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        } ${triggerClassName}`}
      >
        <span
          className={`truncate ${
            disabled || isEmpty ? "text-neutral-400" : "text-neutral-800"
          }`}
        >
          {value || placeholder}
        </span>
        <ChevronDown size={14} className="text-neutral-400 shrink-0" />
      </button>
      {dropdownMenu ? createPortal(dropdownMenu, document.body) : null}
    </div>
  );
}

function MultiSelect({
  values,
  options,
  onChange,
  placeholder = "Select",
  triggerClassName = "",
  dropdownClassName = "",
  searchable = false,
  searchPlaceholder = "Find...",
  withSelectAll = false,
  disabled = false,
  disabledMessage = "Disabled",
  disabledOptions = {},
  getDisabledReason = null,
  /** option value → agent name claiming it; shows “Used by …” with truncation (Team/Board). */
  disabledClaims = {},
  renderOptionLabel = null,
  renderChipLabel = null,
  summaryLabel = null,
  /** Values shown checked with a lock icon; they can't be toggled off. */
  lockedValues = [],
  showCount = false,
  totalCount = null,
  showChips = false,
  /** When false, trigger only shows placeholder; selections are shown elsewhere (e.g. chip row). */
  selectionInTrigger = true,
  menuMaxHeight = "min(34rem, calc(100vh - 6rem))",
  menuWidth,
  menuMinWidth,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState(null);
  const resolvedMenuWidth = (triggerWidth) =>
    menuMinWidth
      ? Math.max(menuWidth ?? triggerWidth, menuMinWidth)
      : menuWidth ?? triggerWidth;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = searchable
    ? options.filter((opt) => opt.toLowerCase().includes(normalizedQuery))
    : options;

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width,
    });
  };

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return undefined;
    }
    updateMenuPosition();
    const handleOutsideClick = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleReposition = () => updateMenuPosition();
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open || !searchable) return;
    searchInputRef.current?.focus();
  }, [open, searchable]);

  const toggle = (opt) => {
    if (lockedValues.includes(opt)) return;
    if (disabledClaims?.[opt]) return;
    const reason = getDisabledReason?.(opt) || disabledOptions?.[opt];
    if (reason) return;
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt));
    } else {
      onChange([...values, opt]);
    }
  };

  const removeValue = (opt) => onChange(values.filter((v) => v !== opt));

  const label =
    summaryLabel ??
    (selectionInTrigger
      ? values.length === 0
        ? placeholder
        : values.length === 1
        ? values[0]
        : `${values.length} selected`
      : placeholder);

  const triggerMuted =
    disabled ||
    (selectionInTrigger && values.length === 0) ||
    (!selectionInTrigger && values.length === 0);

  const dropdownMenu =
    open && menuPosition && !disabled ? (
      <div
        ref={menuRef}
        className={`fixed z-[200] flex min-w-0 flex-col overflow-hidden bg-white border border-neutral-200 rounded-md shadow-lg ${dropdownClassName}`}
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          width: resolvedMenuWidth(menuPosition.minWidth),
          maxHeight: menuMaxHeight,
        }}
      >
        {searchable ? (
          <DropdownMenuSearch
            inputRef={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
          />
        ) : null}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-500">No matches found</div>
          ) : (
            filteredOptions.map((opt) => {
              const selected = values.includes(opt);
              const usedByAgentName = disabledClaims?.[opt];
              const legacyDisabledReason =
                !usedByAgentName && (getDisabledReason?.(opt) || disabledOptions?.[opt]);
              const optionDisabled = Boolean(usedByAgentName || legacyDisabledReason);
              if (optionDisabled) {
                const tooltipText = usedByAgentName
                  ? `Used by ${usedByAgentName}`
                  : legacyDisabledReason;
                const rowInner = (
                  <>
                    <span className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-neutral-400">
                      {renderOptionLabel?.(opt) || opt}
                    </span>
                    {!usedByAgentName && legacyDisabledReason ? (
                      <span className="shrink-0 text-[11px] font-medium text-neutral-400">
                        In use
                      </span>
                    ) : null}
                  </>
                );
                if (tooltipText) {
                  return (
                    <Tooltip key={opt} delayDuration={120}>
                      <TooltipTrigger asChild>
                        <div
                          role="option"
                          aria-disabled="true"
                          className="flex w-full min-w-0 cursor-not-allowed items-center gap-2 bg-neutral-50/90 px-3 py-1.5 text-left text-sm outline-none"
                        >
                          {rowInner}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        {tooltipText}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <div
                    key={opt}
                    role="option"
                    aria-disabled="true"
                    title={tooltipText || undefined}
                    className="flex w-full min-w-0 cursor-not-allowed items-center gap-2 bg-neutral-50/90 px-3 py-1.5 text-left text-sm"
                  >
                    {rowInner}
                  </div>
                );
              }
              if (lockedValues.includes(opt)) {
                return (
                  <Tooltip key={opt} delayDuration={120}>
                    <TooltipTrigger asChild>
                      <div
                        role="option"
                        aria-selected
                        aria-disabled="true"
                        className="flex w-full cursor-default items-center gap-2 bg-neutral-50 px-3 py-1.5 text-left text-sm text-neutral-500"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-neutral-300 bg-neutral-200">
                          <Check size={11} className="text-neutral-400" strokeWidth={3} />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {renderOptionLabel?.(opt) || opt}
                        </span>
                        <Lock size={13} className="shrink-0 text-neutral-400" aria-hidden />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="center"
                      sideOffset={8}
                      arrowClassName="fill-white"
                      className="max-w-[280px] rounded-xl !border-neutral-200 bg-white px-4 py-3 text-sm font-semibold leading-snug text-neutral-900 shadow-xl"
                    >
                      Dispatch status: assigned threads here count toward the tech&apos;s limit.
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggle(opt);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {renderOptionLabel?.(opt) || opt}
                  </span>
                </button>
              );
            })
          )}
        </div>
        {withSelectAll && options.length > 0 && (
          <div className="border-t border-neutral-100 px-1.5 py-1.5 shrink-0 bg-white rounded-b-md">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                if (values.length === options.length) {
                  onChange([]);
                } else {
                  onChange([...options]);
                }
              }}
              className="w-full text-left px-2 py-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-neutral-50 rounded-md"
            >
              {values.length === options.length ? "Clear all" : "Select all"}
            </button>
          </div>
        )}
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative overflow-visible">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        title={disabled ? disabledMessage : undefined}
        className={`flex items-center justify-between gap-2 max-w-[220px] min-h-[34px] px-3 py-1.5 bg-white border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
          disabled
            ? "opacity-60 cursor-not-allowed bg-neutral-50"
            : "hover:border-neutral-300"
        } ${triggerClassName}`}
      >
        <span
          className={`flex-1 text-left ${triggerMuted ? "text-neutral-400" : "text-neutral-800"}`}
        >
          {selectionInTrigger && showChips && values.length > 0 ? (
            <span className="flex flex-wrap items-center gap-1">
              {values.map((opt) => (
                <span
                  key={opt}
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 max-w-[170px]"
                >
                  <span className="truncate">{renderChipLabel?.(opt) || opt}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="text-neutral-500 hover:text-neutral-700 inline-flex"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeValue(opt);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        removeValue(opt);
                      }
                    }}
                    aria-label={`Remove ${opt}`}
                  >
                    <X size={11} />
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <span className="truncate block">{label}</span>
          )}
        </span>
        {selectionInTrigger && showCount && values.length > 0 && (
          <span className="text-xs text-neutral-500 shrink-0 tabular-nums">
            {values.length}
            {typeof totalCount === "number" ? ` / ${totalCount}` : ""}
          </span>
        )}
        <ChevronDown size={14} className="text-neutral-400 shrink-0" />
      </button>
      {dropdownMenu ? createPortal(dropdownMenu, document.body) : null}
    </div>
  );
}

function Row({
  label,
  subcopy,
  children,
  noBorder = false,
  stacked = false,
  align = "start",
}) {
  const borderCls = noBorder ? "" : "relative after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-[#DAD9DD]";
  const rowAlign = align === "center" ? "items-center" : "items-start";
  if (stacked) {
    return (
      <div className={`px-5 py-4 ${borderCls}`}>
        <div className="text-sm font-medium text-neutral-900">{label}</div>
        {subcopy && (
          <div className="text-sm text-neutral-500 mt-0.5 leading-snug">{subcopy}</div>
        )}
        <div className="mt-3 w-full min-w-0">{children}</div>
      </div>
    );
  }
  return (
    <div className={`flex ${rowAlign} justify-between gap-6 px-5 py-4 ${borderCls}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-900">{label}</div>
        {subcopy && (
          <div className="text-sm text-neutral-500 mt-0.5 leading-snug">{subcopy}</div>
        )}
      </div>
      <div
        className={
          align === "center"
            ? "shrink-0"
            : "shrink-0 flex flex-col items-end gap-1"
        }
      >
        {children}
      </div>
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
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">{children}</div>
    </div>
  );
}

function isTeamScopeConfigured(scope) {
  const teams = normalizeSelections(scope.teams ?? scope.team);
  return Boolean(teams.length > 0 && getScopeViews(scope).length > 0);
}

function createTeamCondition(initial = {}) {
  const filterType = initial.filterType ?? initial.field ?? SCOPE_FILTER_OPTIONS[0];
  const fallbackValue =
    typeof initial.value === "string" && initial.value.trim()
      ? [initial.value.trim()]
      : [];
  return {
    id: initial.id ?? newConditionId(),
    filterType,
    operator: "is",
    valueIds: Array.isArray(initial.valueIds) ? initial.valueIds : fallbackValue,
  };
}

function syncTeamConditionsWithTeams(teams, teamConditions = {}) {
  const next = {};
  teams.forEach((team) => {
    next[team] = teamConditions[team] || [];
  });
  return next;
}

function resolveTeamConditions(initial = {}) {
  const teams = normalizeSelections(initial.teams ?? initial.team);
  if (initial.teamConditions && typeof initial.teamConditions === "object") {
    return syncTeamConditionsWithTeams(teams, initial.teamConditions);
  }
  return syncTeamConditionsWithTeams(teams, {});
}

function getBoardStatusOptions(board) {
  if (!board) return [];
  return BOARD_DISPATCH_STATUSES[board] ?? PRODUCTION_BOARD_STATUSES;
}

function getBoardFallbackStatusOptions(board) {
  if (!board) return [];
  const statuses = getBoardStatusOptions(board);
  return ["No change", ...statuses.filter((status) => status !== "No change")];
}

function getBoardsStatusOptions(boards) {
  const seen = new Set();
  const options = [];
  normalizeSelections(boards).forEach((board) => {
    getBoardStatusOptions(board).forEach((status) => {
      if (!seen.has(status)) {
        seen.add(status);
        options.push(status);
      }
    });
  });
  return options;
}

function getBoardsFallbackStatusOptions(boards) {
  const seen = new Set();
  const options = [];
  normalizeSelections(boards).forEach((board) => {
    getBoardFallbackStatusOptions(board).forEach((status) => {
      if (!seen.has(status)) {
        seen.add(status);
        options.push(status);
      }
    });
  });
  return options;
}

function flattenBoardStatuses(boardStatuses = {}) {
  const seen = new Set();
  const result = [];
  Object.values(boardStatuses).forEach((value) => {
    normalizeSelections(value).forEach((status) => {
      if (!seen.has(status)) {
        seen.add(status);
        result.push(status);
      }
    });
  });
  return result;
}

function resolveScopeStatuses(initial = {}) {
  const views = normalizeSelections(
    initial.views ?? initial.view ?? initial.boards ?? initial.board
  );
  if (!views.length) return [];

  if (initial.boardStatuses && typeof initial.boardStatuses === "object") {
    return flattenBoardStatuses(initial.boardStatuses);
  }

  let statuses = [];
  if (Array.isArray(initial.statuses)) {
    statuses = initial.statuses.filter(Boolean);
  } else if (typeof initial.status === "string" && initial.status) {
    statuses = [initial.status];
  }

  const options = new Set(getBoardsStatusOptions(views));
  return statuses.filter((status) => options.has(status));
}

function resolveBoardStatuses(initial = {}) {
  const views = normalizeSelections(
    initial.views ?? initial.view ?? initial.boards ?? initial.board
  );
  const next = {};

  if (initial.boardStatuses && typeof initial.boardStatuses === "object") {
    views.forEach((board) => {
      const options = new Set(getBoardStatusOptions(board));
      const current = normalizeSelections(initial.boardStatuses[board]);
      next[board] = current.filter((status) => options.has(status));
    });
    return next;
  }

  const legacyStatuses = resolveScopeStatuses(initial);
  views.forEach((board, index) => {
    const options = new Set(getBoardStatusOptions(board));
    const legacy = legacyStatuses[index] ?? legacyStatuses[0] ?? "";
    next[board] = legacy && options.has(legacy) ? [legacy] : [];
  });
  return next;
}

function syncBoardStatusesWithViews(views, boardStatuses = {}) {
  const next = {};
  views.forEach((board) => {
    const options = new Set(getBoardStatusOptions(board));
    const current = normalizeSelections(boardStatuses[board]);
    const valid = current.filter((status) => options.has(status));
    next[board] =
      valid.length > 0
        ? valid
        : options.has("Needs dispatch")
          ? ["Needs dispatch"]
          : [];
  });
  return next;
}

function resolveScopeFallbackStatus(initial = {}) {
  const views = normalizeSelections(
    initial.views ?? initial.view ?? initial.boards ?? initial.board
  );
  if (!views.length) return "";

  const options = getBoardsFallbackStatusOptions(views);
  const fallbackStatus = initial.fallbackStatus ?? "";
  return options.includes(fallbackStatus) ? fallbackStatus : "";
}

function createTeamScope(id, initial = {}) {
  const teams = normalizeSelections(initial.teams ?? initial.team);
  const views = normalizeSelections(
    initial.views ?? initial.view ?? initial.boards ?? initial.board
  );
  const teamConditions = resolveTeamConditions(initial);

  return {
    id,
    teams,
    views,
    teamConditions,
    boardStatuses: resolveBoardStatuses({ ...initial, views }),
    statuses: resolveScopeStatuses({ ...initial, views }),
    fallbackStatus: resolveScopeFallbackStatus({ ...initial, views }),
    skipFlowAssignedTickets: initial.skipFlowAssignedTickets ?? false,
  };
}

function isMultiTeamScopeValid(scope) {
  const teams = normalizeSelections(scope.teams ?? scope.team);
  if (teams.length < 2) return true;

  const allConditions = teams.flatMap((team) => scope.teamConditions?.[team] || []);
  return !allConditions.some((condition) => !(condition.valueIds || []).length);
}

function updateTeamConditionInScope(teamConditions, team, conditionId, patch) {
  return {
    ...teamConditions,
    [team]: (teamConditions[team] || []).map((condition) =>
      condition.id === conditionId ? { ...condition, ...patch } : condition
    ),
  };
}

function ScopeCardHeaderLabel({ scope }) {
  const teams = normalizeSelections(scope.teams ?? scope.team);
  const views = getScopeViews(scope);
  const hasTeams = teams.length > 0;
  const hasBoard = views.length > 0;

  if (!hasTeams && !hasBoard) {
    return <span className="font-normal text-[#605F68]">Nothing set up</span>;
  }

  return (
    <>
      {hasTeams ? (
        <span className="inline-flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 font-medium text-neutral-900">
          {teams.map((team, index) => (
            <span key={team} className="inline-flex min-w-0 items-center">
              {index > 0 ? <span className="mr-1 text-[#605F68]">,</span> : null}
              <TeamLabel team={team} />
            </span>
          ))}
        </span>
      ) : (
        <span className="font-normal text-[#605F68]">Select Inbox Team</span>
      )}
      <span className="text-[#605F68]"> • </span>
      <span className="font-normal text-[#605F68]">
        {hasBoard ? views.join(", ") : "Select Board"}
      </span>
    </>
  );
}

function ScopeTeamConditionsEditor({
  team,
  conditions = [],
  teamConditions,
  onUpdateTeamConditions,
  openConditionMenu,
  setOpenConditionMenu,
}) {
  const [valueSearchQuery, setValueSearchQuery] = useState("");
  const valueSearchInputRef = useRef(null);
  const isValueMenuOpen =
    openConditionMenu?.kind === "value" && openConditionMenu.team === team;

  useEffect(() => {
    if (!isValueMenuOpen) {
      setValueSearchQuery("");
      return undefined;
    }
    valueSearchInputRef.current?.focus();
  }, [isValueMenuOpen, openConditionMenu?.conditionId]);

  const activeFilterTypes = new Set(conditions.map((condition) => condition.filterType));
  const availableFilterOptions = SCOPE_FILTER_OPTIONS.filter(
    (filterType) => !activeFilterTypes.has(filterType)
  );
  const normalizedValueSearchQuery = valueSearchQuery.trim().toLowerCase();
  const [fieldSearchQuery, setFieldSearchQuery] = useState("");
  const isFieldMenuOpen =
    openConditionMenu?.kind === "field" && openConditionMenu.team === team;
  useEffect(() => {
    if (!isFieldMenuOpen) setFieldSearchQuery("");
  }, [isFieldMenuOpen]);
  const visibleFilterOptions = availableFilterOptions.filter((filterType) =>
    filterType.toLowerCase().includes(fieldSearchQuery.trim().toLowerCase())
  );

  const handleAddFilter = (filterType) => {
    const existing = teamConditions[team] || [];
    if (existing.some((condition) => condition.filterType === filterType)) return;
    onUpdateTeamConditions({
      ...teamConditions,
      [team]: [...existing, createTeamCondition({ filterType, valueIds: [] })],
    });
    setOpenConditionMenu(null);
  };

  const handleRemoveCondition = (condition) => {
    onUpdateTeamConditions({
      ...teamConditions,
      [team]: (teamConditions[team] || []).filter((entry) => entry.id !== condition.id),
    });
  };

  const handleToggleValue = (condition, value) => {
    const current = condition.valueIds || [];
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    onUpdateTeamConditions(
      updateTeamConditionInScope(teamConditions, team, condition.id, { valueIds: next })
    );
  };

  const conditionValueLabel = (condition) => {
    const values = condition.valueIds || [];
    if (values.length === 0) return "...";
    if (values.length === 1) return values[0];
    return `${values.length} selected`;
  };

  const menuTeam = openConditionMenu?.team;
  const menuConditionId = openConditionMenu?.conditionId;

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {conditions.map((condition) => {
        const filterMeta = SCOPE_FILTER_METADATA[condition.filterType];
        const FilterIcon = filterMeta?.icon || FileText;
        const valueOptions = filterMeta?.values || [];
        const selectedValues = condition.valueIds || [];
        const valueMenuOpen =
          openConditionMenu?.kind === "value" &&
          menuTeam === team &&
          menuConditionId === condition.id;
        const hasEmptyValue = !selectedValues.length;
        const filteredValueOptions = valueOptions.filter((value) =>
          value.toLowerCase().includes(normalizedValueSearchQuery)
        );

        return (
          <div
            key={condition.id}
            className="relative inline-flex h-6 items-center rounded-md border border-neutral-300 bg-white text-[12px] text-neutral-800"
          >
            <span className="inline-flex items-center gap-1 border-r border-neutral-300 px-2 py-[3px]">
              <FilterIcon size={12} className="text-neutral-500" />
              <span>{condition.filterType}</span>
            </span>
            <span className="border-r border-neutral-300 px-2 py-[3px] text-neutral-700">
              is
            </span>
            <button
              type="button"
              data-condition-menu-trigger=""
              onClick={() =>
                setOpenConditionMenu((prev) =>
                  prev?.kind === "value" &&
                  prev.team === team &&
                  prev.conditionId === condition.id
                    ? null
                    : { kind: "value", team, conditionId: condition.id }
                )
              }
              className={`max-w-[230px] truncate border-r border-neutral-300 px-2 py-[3px] text-left text-neutral-900 transition-colors hover:bg-neutral-50/80 ${
                hasEmptyValue ? "text-neutral-400" : ""
              }`}
            >
              {conditionValueLabel(condition)}
            </button>
            <button
              type="button"
              onClick={() => handleRemoveCondition(condition)}
              className="px-1.5 text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
              aria-label="Remove condition"
            >
              <X size={12} />
            </button>

            {valueMenuOpen ? (
              <div
                data-condition-menu=""
                className="absolute left-0 top-full z-[120] mt-1 flex w-[240px] min-w-0 max-w-[240px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl"
              >
                <DropdownMenuSearch
                  inputRef={valueSearchInputRef}
                  value={valueSearchQuery}
                  onChange={(e) => setValueSearchQuery(e.target.value)}
                  placeholder="Search"
                />
                <div className="max-h-[220px] min-w-0 overflow-x-hidden overflow-y-auto p-1.5">
                  {filteredValueOptions.length === 0 ? (
                    <div className="px-2 py-2 text-[12px] text-neutral-500">No matches found</div>
                  ) : (
                    filteredValueOptions.map((value) => {
                        const checked = selectedValues.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleToggleValue(condition, value)}
                            className="flex w-full max-w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[12px] text-neutral-900 hover:bg-neutral-50"
                          >
                            <span
                              className={`flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[4px] border ${
                                checked
                                  ? "border-emerald-500 bg-emerald-500"
                                  : "border-neutral-300 bg-white"
                              }`}
                            >
                              {checked ? (
                                <Check size={10} className="text-white" strokeWidth={3} />
                              ) : null}
                            </span>
                            <span className="min-w-0 truncate">{value}</span>
                          </button>
                        );
                      })
                  )}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      {availableFilterOptions.length > 0 ? (
        <div className="relative">
          <button
            type="button"
            data-condition-menu-trigger=""
            onClick={() =>
              setOpenConditionMenu((prev) =>
                prev?.kind === "field" && prev.team === team
                  ? null
                  : { kind: "field", team }
              )
            }
            className="inline-flex h-6 items-center gap-1 rounded-md border border-emerald-500 px-2 py-[3px] text-[12px] font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            <Plus size={12} />
            Add filter
          </button>
          {openConditionMenu?.kind === "field" && openConditionMenu.team === team ? (
            <div
              data-condition-menu=""
              className="absolute left-0 top-full z-[120] mt-1 w-[240px] overflow-x-hidden rounded-xl border border-neutral-200 bg-white shadow-xl"
            >
              <DropdownMenuSearch
                value={fieldSearchQuery}
                onChange={(e) => setFieldSearchQuery(e.target.value)}
                placeholder="Search"
              />
              <div className="p-2">
              {visibleFilterOptions.map((filterType) => {
                const FilterIcon = SCOPE_FILTER_METADATA[filterType]?.icon || FileText;
                return (
                  <button
                    key={filterType}
                    type="button"
                    onClick={() => handleAddFilter(filterType)}
                    className="flex max-w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-50"
                  >
                    <FilterIcon size={16} className="shrink-0 text-neutral-500" />
                    <span className="min-w-0 truncate">{filterType}</span>
                  </button>
                );
              })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AgentScopeTeamCard({
  scope,
  disabledTeamClaims = {},
  showExcludeTechs = false,
  excludeTechs = [],
  onExcludeTechsChange,
  onRemove,
  onUpdate,
}) {
  const [openConditionMenu, setOpenConditionMenu] = useState(null);
  const teams = normalizeSelections(scope.teams ?? scope.team);
  const teamConditions = scope.teamConditions || {};
  const boardStatuses = scope.boardStatuses ?? {};

  const handleTeamsChange = (nextTeams) => {
    onUpdate({
      teams: nextTeams,
      teamConditions: syncTeamConditionsWithTeams(nextTeams, teamConditions),
    });
  };

  const handleTeamConditionsChange = (nextTeamConditions) => {
    onUpdate({ teamConditions: nextTeamConditions });
  };

  const views = getScopeViews(scope);
  const hasBoard = views.length > 0;

  const orphanedExcludedTechs = useMemo(() => {
    if (!showExcludeTechs || excludeTechs.length === 0) return [];
    return excludeTechs.filter((techName) => {
      const tech = TECHS.find((entry) => entry.name === techName);
      if (!tech) return true;
      if (teams.length === 0) return true;
      return !tech.teams.some((team) => teams.includes(team));
    });
  }, [excludeTechs, showExcludeTechs, teams]);
  const excludedTechsWarning = formatExcludedTechsWarning(orphanedExcludedTechs);

  const handleBoardsChange = (nextViews) => {
    const patch = { views: nextViews };
    if (!nextViews.length) {
      patch.boardStatuses = {};
      patch.statuses = [];
      patch.fallbackStatus = "";
      onUpdate(patch);
      return;
    }

    const nextBoardStatuses = syncBoardStatusesWithViews(nextViews, boardStatuses);
    patch.boardStatuses = nextBoardStatuses;
    patch.statuses = flattenBoardStatuses(nextBoardStatuses);

    const nextFallbackOptions = new Set(getBoardsFallbackStatusOptions(nextViews));
    if (scope.fallbackStatus && !nextFallbackOptions.has(scope.fallbackStatus)) {
      patch.fallbackStatus = "";
    }
    onUpdate(patch);
  };

  const handleBoardStatusChange = (board, statuses) => {
    const nextBoardStatuses = { ...boardStatuses, [board]: statuses };
    onUpdate({
      boardStatuses: nextBoardStatuses,
      statuses: flattenBoardStatuses(nextBoardStatuses),
    });
  };

  useEffect(() => {
    if (!openConditionMenu) return undefined;
    const handleMouseDown = (event) => {
      const target = event.target;
      if (target instanceof Element) {
        if (target.closest("[data-condition-menu]")) return;
        if (target.closest("[data-condition-menu-trigger]")) return;
      }
      setOpenConditionMenu(null);
    };
    const handleEsc = (event) => {
      if (event.key === "Escape") setOpenConditionMenu(null);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [openConditionMenu]);

  const renderConditionsForTeam = (team) => (
    <ScopeTeamConditionsEditor
      team={team}
      conditions={teamConditions[team] || []}
      teamConditions={teamConditions}
      onUpdateTeamConditions={handleTeamConditionsChange}
      openConditionMenu={openConditionMenu}
      setOpenConditionMenu={setOpenConditionMenu}
    />
  );

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-visible shadow-sm">
      <div className="flex items-center gap-3 relative after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-[#DAD9DD] px-5 py-3.5">
        <span className="min-w-0 flex-1 truncate text-sm">
          <ScopeCardHeaderLabel scope={scope} />
        </span>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Remove dispatch scope"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div>
          <div className="relative after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-[#DAD9DD] px-5 py-4">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-neutral-900">Dispatch from</div>
                <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                  Select the board to dispatch threads from. Only unassigned threads will enter the
                  queue.
                </p>
              </div>
              <MultiSelect
                values={views}
                options={SCOPE_BOARD_OPTIONS}
                onChange={handleBoardsChange}
                placeholder="Select Board"
                searchable
                searchPlaceholder="Search boards"
                summaryLabel={
                  views.length === 0
                    ? undefined
                    : views.length === 1
                      ? views[0]
                      : `${views.length} selected`
                }
                menuMinWidth={SCOPE_DROPDOWN_MIN_WIDTH}
              />
            </div>
            {hasBoard ? (
              <ScopeNestedGroup>
                {views.map((board) => {
                  const selectedBoardStatuses = normalizeSelections(boardStatuses[board]);
                  return (
                    <div key={board} className="flex items-start justify-between gap-6">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-neutral-900">
                          {scopeBoardStatusLabel(board)}
                        </div>
                        <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                          Select status(es) the dispatcher should focus on in this board. Once
                          assigned, these threads count toward a tech&apos;s active thread limit.
                        </p>
                      </div>
                      <MultiSelect
                        values={selectedBoardStatuses}
                        options={getBoardStatusOptions(board)}
                        onChange={(statuses) => handleBoardStatusChange(board, statuses)}
                        placeholder="Select status"
                        searchable
                        searchPlaceholder="Search statuses"
                        summaryLabel={
                          selectedBoardStatuses.length === 0
                            ? undefined
                            : selectedBoardStatuses.length === 1
                              ? selectedBoardStatuses[0]
                              : `${selectedBoardStatuses.length} selected`
                        }
                        menuMinWidth={SCOPE_DROPDOWN_MIN_WIDTH}
                      />
                    </div>
                  );
                })}
              </ScopeNestedGroup>
            ) : null}
          </div>

          <div
            className={`px-5 py-4 ${
              showExcludeTechs ? "relative after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-[#DAD9DD]" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-neutral-900">Dispatch to</div>
                <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                  Select the Inbox Team threads will be dispatched to.
                </p>
              </div>
              <MultiSelect
                values={teams}
                options={TEAMS}
                onChange={handleTeamsChange}
                placeholder="Select Inbox Team"
                searchable
                searchPlaceholder="Search teams"
                renderOptionLabel={(team) => (
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <TeamIcon team={team} />
                    <span className="truncate">{team}</span>
                  </span>
                )}
                summaryLabel={
                  teams.length === 0
                    ? undefined
                    : teams.length === 1
                      ? teams[0]
                      : `${teams.length} selected`
                }
                menuMinWidth={SCOPE_DROPDOWN_MIN_WIDTH}
                disabledClaims={disabledTeamClaims}
              />
            </div>

            {teams.length > 0 ? (
              <div className="mt-4 space-y-3">
                {teams.map((team) => (
                  <div key={team} className="space-y-2">
                    <div className="text-sm font-medium text-neutral-900">
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <TeamIcon team={team} />
                        <span>{team}</span>
                      </span>
                    </div>
                    {renderConditionsForTeam(team)}
                  </div>
                ))}
                <p className="text-sm text-neutral-500">
                  Filters help to narrow the scope of threads that teams should focus on
                  (optional).
                </p>
              </div>
            ) : null}
          </div>

          {showExcludeTechs ? (
            <div className="px-5 py-4">
              <div className="text-sm font-medium text-neutral-900">Exclude techs</div>
              <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                Techs selected here will be skipped during dispatch.
              </p>
              <div className="mt-3">
                <MultiSelect
                  values={excludeTechs}
                  options={TECH_NAMES}
                  onChange={onExcludeTechsChange}
                  placeholder="Select techs"
                  searchable
                  searchPlaceholder="Search techs..."
                  showChips
                  triggerClassName="!max-w-none w-full max-w-none"
                  menuMinWidth={280}
                  dropdownClassName="w-[320px]"
                />
              </div>
              {excludedTechsWarning ? (
                <div className="mt-2 flex items-start gap-1.5 text-sm text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" strokeWidth={2} />
                  <span>{excludedTechsWarning}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
    </div>
  );
}

function ComingSoon() {
  return <span className="text-sm text-neutral-400">Coming soon</span>;
}

// Ticket context the routing agent receives alongside each prompt. The agent
// reads these values directly — users should write rules in plain language
// rather than referencing the {{token}} names.
const AGENT_CONTEXT_FIELDS = [
  { label: "Contact company name", token: "company_name" },
  { label: "Contact company type", token: "company_type" },
  { label: "Ticket contact name", token: "contact_name" },
  { label: "Ticket contact types", token: "contact_type" },
  { label: "Ticket summary", token: "summary" },
  { label: "Ticket chat history", token: "ticket_chat" },
  { label: "Ticket priority", token: "priority" },
  { label: "Ticket type", token: "type" },
  { label: "Ticket subtype", token: "subtype" },
  { label: "Ticket item", token: "item" },
  { label: "Ticket agreement name", token: "ticket_agreement" },
  { label: "Ticket agreement type", token: "ticket_agreement_type" },
  { label: "Ticket configuration", token: "ticket_configuration" },
];

const RANKING_SIGNAL_DEFINITIONS = [
  {
    id: "priority",
    name: "Priority",
    description: "Higher priority tickets rank first.",
    enabled: true,
    value: 100,
  },
  {
    id: "ticket-age",
    name: "Ticket age",
    description: "Older tickets rank higher.",
    enabled: true,
    value: 64,
  },
  {
    id: "client-replied",
    name: "Client replied",
    description: "Tickets with unanswered replies rank higher.",
    enabled: true,
    value: 44,
  },
  {
    id: "sentiment",
    name: "Sentiment",
    description: "Tickets with negative client sentiment rank higher.",
    enabled: true,
    value: 25,
  },
  {
    id: "company-type",
    name: "Company type",
    description: "Tickets matching any selected company type rank higher.",
    enabled: true,
    value: 11,
    options: COMPANY_TYPE_OPTIONS,
    selectedOptions: [],
    multiSelect: true,
  },
  {
    id: "contact-type",
    name: "Contact type",
    description: "Tickets matching any selected contact type rank higher.",
    enabled: true,
    value: 0,
    options: ["Standard", "VIP", "Executive"],
    selectedOptions: [],
    multiSelect: true,
  },
  {
    id: "agreement-type",
    name: "Agreement Type",
    description: "Tickets matching any selected agreement type rank higher.",
    enabled: true,
    value: 0,
    options: [
      "Block Time - One time",
      "Block Time - Recurring",
      "Managed Service",
      "Monitoring",
      "Time and materials",
    ],
    selectedOptions: [],
    multiSelect: true,
  },
  {
    id: "source",
    name: "Source",
    description: "Tickets from the selected sources rank higher.",
    enabled: true,
    value: 0,
    options: [
      "Attendant Phone",
      "Automate",
      "Chatgenie Messenger",
      "Email",
      "Internal",
      "Overflow Phone",
      "Phone",
      "Thread Messenger",
    ],
    selectedOptions: [],
    multiSelect: true,
  },
];

function clampRankingWeight(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? Math.max(0, Math.min(100, Math.round(next))) : fallback;
}

const RANKING_LEVELS = [
  { max: 0, label: "Not used" },
  { max: 17, label: "Low" },
  { max: 34, label: "Medium" },
  { max: 54, label: "High" },
  { max: 89, label: "Very high" },
  { max: 100, label: "Highest" },
];

function getRankingLevelLabel(value) {
  const amount = Number(value) || 0;
  return (RANKING_LEVELS.find((level) => amount <= level.max) ?? RANKING_LEVELS.at(-1)).label;
}

function mergeRankingSignalDefinition(definition, saved) {
  const nextValue = Number(saved?.value);
  const hasOptions = Array.isArray(definition.options) && definition.options.length > 0;

  if (definition.multiSelect && hasOptions) {
    const savedOptions = Array.isArray(saved?.selectedOptions)
      ? saved.selectedOptions.filter((opt) => definition.options.includes(opt))
      : [];
    const migratedFromSingle =
      typeof saved?.selectedOption === "string" &&
      definition.options.includes(saved.selectedOption)
        ? [saved.selectedOption]
        : [];
    const fallbackOptions = Array.isArray(definition.selectedOptions)
      ? definition.selectedOptions.filter((opt) => definition.options.includes(opt))
      : definition.options[0]
      ? [definition.options[0]]
      : [];
    const selectedOptions =
      savedOptions.length > 0
        ? savedOptions
        : migratedFromSingle.length > 0
        ? migratedFromSingle
        : fallbackOptions;

    const migratedValue =
      saved?.enabled === false && !Number.isFinite(nextValue) ? 0 : nextValue;

    return {
      ...definition,
      enabled: true,
      value: Number.isFinite(migratedValue)
        ? Math.max(0, Math.min(100, migratedValue))
        : definition.value,
      selectedOptions,
    };
  }

  const fallbackOption = hasOptions ? definition.selectedOption ?? definition.options[0] : undefined;
  const selectedOption =
    hasOptions && definition.options.includes(saved?.selectedOption)
      ? saved.selectedOption
      : fallbackOption;
  const migratedValue =
    saved?.enabled === false && !Number.isFinite(nextValue) ? 0 : nextValue;

  return {
    ...definition,
    enabled: true,
    value: Number.isFinite(migratedValue)
      ? Math.max(0, Math.min(100, migratedValue))
      : definition.value,
    selectedOption,
  };
}

function normalizeRankingSignals(initialSignals) {
  const savedById = new Map(
    Array.isArray(initialSignals) ? initialSignals.map((signal) => [signal.id, signal]) : []
  );

  return RANKING_SIGNAL_DEFINITIONS.map((definition) =>
    mergeRankingSignalDefinition(definition, savedById.get(definition.id))
  );
}

function buildAgentInstructionsFromSignals(signals) {
  const signalLines = signals.map((signal, index) => {
    const optionText = signal.options
      ? signal.multiSelect
        ? `, filter is ${(signal.selectedOptions ?? []).join(", ") || "none"}`
        : `, filter is ${signal.selectedOption}`
      : "";
    return `${index + 1}. ${signal.name}: weight ${signal.value}${optionText}.`;
  });

  return `You are a dispatch ranking agent. Rank tickets by urgency based on these configured ticket properties:
${signalLines.join("\n")}`;
}

function RankingPropertyRow({ signal, onSetWeight, onPatchSignal, isLast }) {
  const hasOptions = Array.isArray(signal.options) && signal.options.length > 0;
  const unused = (Number(signal.value) || 0) === 0;
  const selected = signal.selectedOptions ?? [];

  return (
    <div
      className={`flex items-center gap-6 px-5 py-4 ${
        isLast ? "" : "relative after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-[#DAD9DD]"
      }`}
    >
      <div className={`min-w-0 flex-1 ${unused ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-neutral-900">{signal.name}</div>
          {hasOptions ? (
            <>
              <span className="text-sm text-neutral-500">is</span>
              <MultiSelect
                values={selected}
                options={signal.options}
                onChange={(selectedOptions) => onPatchSignal(signal.id, { selectedOptions })}
                placeholder="Select"
                searchable
                searchPlaceholder="Search"
                summaryLabel={
                  selected.length === 0
                    ? undefined
                    : selected.length === 1
                      ? selected[0]
                      : `${selected.length} selected`
                }
                menuMinWidth={signal.id === "agreement-type" ? 300 : 220}
              />
            </>
          ) : null}
        </div>
        <p className="mt-0.5 text-[13px] text-neutral-500">{signal.description}</p>
      </div>

      <div className="flex w-[260px] shrink-0 items-center gap-5">
        <span className="w-[84px] shrink-0 text-right text-xs text-neutral-600">
          {getRankingLevelLabel(signal.value)}
        </span>
        <div className="min-w-0 flex-1">
          <Slider
            gradient
            min={0}
            max={100}
            step={1}
            value={[signal.value]}
            onValueChange={([value]) => onSetWeight(signal.id, value)}
          />
        </div>
      </div>
    </div>
  );
}

const RANKING_SIGNALS_INFO_ARIA_LABEL = "Thread scoring info";
const RANKING_SIGNALS_INFO_BODY =
  "Control how much each ticket property (priority, age, sentiment) influences which tickets get worked first.";
const RANKING_SIGNALS_INFO_FOOTNOTE =
  "The defaults set work well for most teams.";

function RankingSignalsSection({ signals, onChangeSignals }) {
  const handleSetWeight = (signalId, value) => {
    const clamped = clampRankingWeight(value);
    onChangeSignals((prev) =>
      prev.map((signal) =>
        signal.id === signalId ? { ...signal, value: clamped, enabled: true } : signal
      )
    );
  };

  const handlePatchSignal = (signalId, patch) => {
    onChangeSignals((prev) =>
      prev.map((signal) => (signal.id === signalId ? { ...signal, ...patch } : signal))
    );
  };

  return (
    <div className="mb-10">
      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold text-neutral-900">Thread scoring</h2>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex rounded p-0.5 text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                aria-label={RANKING_SIGNALS_INFO_ARIA_LABEL}
              >
                <Info size={14} aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              sideOffset={8}
              className="w-[300px] max-w-[300px] rounded-lg !border !border-[#E9E9EB] bg-white px-4 py-3 text-neutral-900 shadow-lg"
            >
              <p className="text-sm text-neutral-500">{RANKING_SIGNALS_INFO_BODY}</p>
              <p className="mt-2 text-sm text-neutral-500">{RANKING_SIGNALS_INFO_FOOTNOTE}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-0.5 text-sm text-neutral-500">
          Set how much each signal influences ticket ranking. Signals set to &quot;Not used&quot; are excluded.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="relative after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-[#DAD9DD] px-5 py-4 text-right text-sm font-medium text-neutral-500">
          Importance
        </div>
        {signals.map((signal, index) => (
          <RankingPropertyRow
            key={signal.id}
            signal={signal}
            isLast={index === signals.length - 1}
            onSetWeight={handleSetWeight}
            onPatchSignal={handlePatchSignal}
          />
        ))}
      </div>
    </div>
  );
}

function AgentContextPopover() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded-md hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Info size={13} />
        Agent context
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute right-0 top-full mt-2 w-[340px] bg-white border border-neutral-200 rounded-lg shadow-lg p-4 z-30"
        >
          <div className="text-sm font-medium text-neutral-900 mb-1.5">
            What the agent already knows
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed mb-3">
            The agent reads each ticket&apos;s details before evaluating your rules. Write your
            prompt in plain, natural language — you don&apos;t need to reference variable names.
          </p>
          <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
            Available context
          </div>
          <ul className="space-y-1">
            {AGENT_CONTEXT_FIELDS.map((f) => (
              <li
                key={f.token}
                className="flex items-center justify-between gap-3 text-xs text-neutral-700"
              >
                <span>{f.label}</span>
                <span className="font-mono text-[11px] text-neutral-400">
                  {`{{${f.token}}}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SIDEBAR
// =============================================================================

// Items that have an actual destination wired up. Other sidebar items are
// visible for layout but click-to-nothing — they don't switch sections.
const NAVIGABLE_ITEMS = new Set(["Auto-dispatch", "Flows", "SLAs"]);

function Sidebar({ active = "Auto-dispatch", onSelect }) {
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
        { icon: Shuffle, label: "Status Mapping" },
        { icon: CheckSquare, label: "Flows" },
        { icon: Clock, label: "Auto-dispatch" },
      ],
    },
    {
      label: "Communication",
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
        { icon: CalendarDays, label: "Work schedules" },
        { icon: Clock, label: "XLAs", id: "SLAs" },
        { icon: User, label: "Members" },
        { icon: Plug, label: "Integrations" },
        { icon: ShieldCheck, label: "Security Center" },
        { icon: Activity, label: "Analytics" },
        { icon: Wallet, label: "Partner value" },
        { icon: Star, label: "Feedback" },
      ],
    },
  ];

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-[#FAF9F6]">
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-neutral-900">ACME</div>
          <div className="text-[11px] text-neutral-400">Ricky&apos;s Organization</div>
        </div>
        <ChevronDown size={12} className="ml-auto text-neutral-400" />
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-neutral-600 hover:bg-neutral-50 cursor-pointer">
          <Zap size={15} />
          <span>Get started</span>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-hidden px-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <div className="px-3 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
              {g.label}
            </div>
            <div className="space-y-0.5">
              {g.items.map(({ icon: Icon, label, id = label }) => {
                const navigable = NAVIGABLE_ITEMS.has(id);
                return (
                  <div
                    key={label}
                    onClick={() => navigable && onSelect?.(id)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm ${
                      active === id
                        ? "bg-[rgba(229,228,224,0.55)] text-neutral-900 font-medium"
                        : "text-neutral-600 hover:bg-[rgba(229,228,224,0.55)]"
                    } ${navigable ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <Icon size={15} className="shrink-0" />
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="mb-5">
          <div className="flex items-center justify-between px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
            <span className="inline-flex items-center gap-1">
              Your teams <ChevronDown size={11} />
            </span>
            <Plus size={13} />
          </div>
          <div className="space-y-0.5">
            {["Team A", "Team A - L1"].map((team) => (
              <div
                key={team}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-neutral-600 cursor-default"
              >
                <Users size={15} className="shrink-0" />
                <span>{team}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-neutral-600 cursor-default">
              <Plus size={15} className="shrink-0" />
              <span>Create new team</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-500">
        <div className="flex items-center gap-2">
          <Inbox size={15} />
          <span>Inbox</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-neutral-200/70 text-[11px] font-semibold text-neutral-700">
            RB
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
          </span>
          <ChevronDown size={13} />
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
  onToggleActive,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const agentTeams = normalizeSelections(agent.teams ?? agent.team);
  const agentBoards = normalizeSelections(agent.boards ?? agent.board);
  const leadTeam = agentTeams[0] || "Unassigned";

  const fallbackTitle =
    agent.mode === "Route" ? "Routing Agent" : `${leadTeam} Dispatch Agent`;
  const displayTitle = agent.name?.trim() || fallbackTitle;
  const boardCount = agentBoards.length;
  const teamCount = agentTeams.length;
  const boardNoun = boardCount === 1 ? "board" : "boards";
  const teamNoun = teamCount === 1 ? "team" : "teams";
  const subtitle = `Dispatching from ${boardCount} ${boardNoun} across ${teamCount} ${teamNoun}`;
  const lastSavedAt = agent.lastPublishedAt ? new Date(agent.lastPublishedAt) : null;
  const lastSavedLabel =
    lastSavedAt && !Number.isNaN(lastSavedAt.getTime()) ? formatLastSaved(lastSavedAt) : null;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-visible shadow-sm">
      {/* Top row: icon, title, toggle (no row hover — open agent from configuration strip or ⋯) */}
      <div className="flex items-center gap-4 px-5 py-4 rounded-t-xl">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-neutral-200 bg-[#FAF9F6]"
          aria-hidden
        >
          <div
            className={`size-6 shrink-0 rounded-full ${avatarSwatchClass(agent.avatarId)}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-neutral-900">{displayTitle}</div>
          {lastSavedLabel ? (
            <div className="text-[13px] text-neutral-500 mt-0.5">{lastSavedLabel}</div>
          ) : null}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={agent.active}
            onCheckedChange={() => onToggleActive(agent.id)}
          />
        </div>
      </div>

      {/* Bottom row: full-row hover highlights configuration; ⋯ excludes row click */}
      <div
        role="button"
        tabIndex={0}
        className="flex items-center px-5 py-2.5 relative after:pointer-events-none after:absolute after:inset-x-4 after:top-0 after:h-px after:bg-[#DAD9DD] bg-white rounded-b-xl cursor-pointer outline-none transition-colors hover:bg-[rgba(236,236,237,0.6)] active:bg-[rgba(236,236,237,0.75)] focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        onClick={(e) => {
          if (e.target.closest("[data-agent-card-menu]")) return;
          onOpen();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <div className="flex-1 min-w-0 py-2 pr-3">
          <div className="text-sm font-medium text-neutral-900">Configuration</div>
          <div className="text-[13px] text-neutral-500 mt-0.5 truncate">{subtitle}</div>
        </div>
        <div className="relative shrink-0 self-stretch flex items-center" data-agent-card-menu>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/80"
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
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#FAF9F6]">
      <header className="shrink-0 bg-white px-8 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] relative z-10">
        <h1 className="text-xl font-normal text-neutral-900">Auto-dispatch</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-12">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-10 h-10 rounded-md bg-emerald-100 flex items-center justify-center mb-4">
            <ListChecks size={20} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Auto-dispatch</h2>
          <p className="text-sm text-neutral-500 mt-2 max-w-lg leading-relaxed">
            Set up auto-dispatch to automatically assign tickets to your team, or build a prioritized queue that people can pull from.
          </p>
          {!isEmpty && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm mt-5"
            >
              <Plus size={15} />
              Create dispatcher
            </button>
          )}
        </div>

        <div className="border-t border-neutral-200 pt-8">
          {isEmpty ? (
            <div className="border border-dashed border-[#00BB99] rounded-xl bg-transparent py-14 px-6 flex flex-col items-center">
              <div className="text-[14px] font-semibold text-neutral-900">
                No dispatching configured
              </div>
              <p className="text-sm text-neutral-500 mt-1.5 mb-6 max-w-sm text-center">
                Set up your first dispatcher and start assigning tickets to your team.
              </p>
              <button
                onClick={onCreate}
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-colors"
              >
                <Plus size={15} />
                Create dispatcher
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
                  onToggleActive={onToggleActive}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </main>
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
  const isSchedule = mode === "Assign + Schedule";


  // --- Dispatcher identity
  const [agentDisplayName, setAgentDisplayName] = useState(initialAgent?.name ?? "");
  const [avatarId, setAvatarId] = useState(initialAgent?.avatarId ?? "avatar-1");
  const [dispatchMode, setDispatchMode] = useState(() => {
    const saved = initialAgent?.dispatchMode;
    if (saved === "Self-serve") return "Next thread";
    return saved ?? "Auto-assign";
  });
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [flowsConflictBannerDismissed, setFlowsConflictBannerDismissed] = useState(false);
  const TEST_PANEL_MIN_WIDTH = 320;
  const TEST_PANEL_MAX_WIDTH = 720;
  const [testPanelOpen, setTestPanelOpen] = useState(false);
  const [testPanelWidth, setTestPanelWidth] = useState(400);
  const [isResizingTestPanel, setIsResizingTestPanel] = useState(false);
  const testPanelResizeStartRef = useRef({ x: 0, width: 400 });
  const avatarPickerWrapRef = useRef(null);

  const handleTestPanelResizeStart = (event) => {
    event.preventDefault();
    testPanelResizeStartRef.current = { x: event.clientX, width: testPanelWidth };
    setIsResizingTestPanel(true);
  };

  useEffect(() => {
    if (!isResizingTestPanel) return undefined;

    const handleMouseMove = (event) => {
      const { x, width } = testPanelResizeStartRef.current;
      const nextWidth = Math.min(
        TEST_PANEL_MAX_WIDTH,
        Math.max(TEST_PANEL_MIN_WIDTH, width + (x - event.clientX))
      );
      setTestPanelWidth(nextWidth);
    };

    const handleMouseUp = () => setIsResizingTestPanel(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingTestPanel]);

  useEffect(() => {
    if (!avatarPickerOpen) return undefined;
    const handler = (e) => {
      if (avatarPickerWrapRef.current?.contains(e.target)) return;
      setAvatarPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarPickerOpen]);

  // --- Agent scope
  const [active, setActive] = useState(initialAgent?.active ?? false);
  const [boards, setBoards] = useState(
    normalizeSelections(initialAgent?.boards ?? initialAgent?.board)
  );
  const [teamScopes, setTeamScopes] = useState(() => {
    const initialTeams = normalizeSelections(initialAgent?.teams ?? initialAgent?.team);
    const initialViews = normalizeSelections(initialAgent?.boards ?? initialAgent?.board);
    const initialScopeRecords = Array.isArray(initialAgent?.teamScopes)
      ? initialAgent.teamScopes
      : [];
    if (initialScopeRecords.length > 0) {
      return initialScopeRecords.map((scope, index) =>
        createTeamScope(index + 1, {
          ...scope,
          teams: normalizeSelections(
            scope.teams ?? scope.team ?? (initialTeams[index] ? [initialTeams[index]] : [])
          ),
          views: normalizeSelections(
            scope.views ??
              scope.view ??
              scope.board ??
              scope.boards ??
              (initialViews[index] ? [initialViews[index]] : initialViews)
          ),
          fallbackStatus: scope.fallbackStatus ?? initialAgent?.fallbackStatus,
        })
      );
    }
    if (initialTeams.length > 0) {
      return initialTeams.map((team, index) =>
        createTeamScope(index + 1, {
          teams: [team],
          views: normalizeSelections(
            initialViews[index] ? [initialViews[index]] : initialViews
          ),
          statuses: initialAgent?.statuses ?? [],
          fallbackStatus: initialAgent?.fallbackStatus,
          skipFlowAssignedTickets: initialAgent?.skipFlowAssignedTickets ?? false,
        })
      );
    }
    return [createTeamScope(1)];
  });
  const [statusMode, setStatusMode] = useState("Include only");
  const [statuses, setStatuses] = useState(initialAgent?.statuses ?? []);

  // --- Working hours (Assign + Schedule)
  const [startTime, setStartTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("5:00 PM");
  const [offset, setOffset] = useState("Every 30 min");
  const [scheduleInterval, setScheduleInterval] = useState("Every 15 min");
  const [scheduleWindow, setScheduleWindow] = useState("Today only");
  const [slotSelection, setSlotSelection] = useState("Earliest available");
  const [duration, setDuration] = useState("30 min");

  // --- Technician assignment (Auto-assign)
  const [noTechAction, setNoTechAction] = useState("Retry assignment");
  const [boardExtraStatuses, setBoardExtraStatuses] = useState({});
  const [perTeamLimitsEnabled, setPerTeamLimitsEnabled] = useState(
    initialAgent?.perTeamLimitsEnabled ?? false
  );
  const [teamMaxActiveThreads, setTeamMaxActiveThreads] = useState(
    initialAgent?.teamMaxActiveThreads ?? {}
  );
  const [boardFallbackStatuses, setBoardFallbackStatuses] = useState({});
  const [scheduleNoticeAmount, setScheduleNoticeAmount] = useState("");
  const [scheduleNoticeUnit, setScheduleNoticeUnit] = useState("minutes");
  const [bookingDurationAmount, setBookingDurationAmount] = useState("");
  const [bookingDurationUnit, setBookingDurationUnit] = useState("minutes");
  const [maxActiveThreads, setMaxActiveThreads] = useState(
    initialAgent?.maxActiveThreads ?? "No limit"
  );
  const [excludeTechs, setExcludeTechs] = useState(() =>
    normalizeSelections(initialAgent?.excludeTechs)
  );
  const [calendarAvailabilityEnabled, setCalendarAvailabilityEnabled] = useState(() => {
    const agent = initialAgent;
    if (!agent) return false;
    if (typeof agent.calendarAvailabilityEnabled === "boolean") {
      return agent.calendarAvailabilityEnabled;
    }
    if (agent.calendarAvailability === "Ignore") return false;
    if (agent.calendarAvailability) return true;
    if (agent.calendarAvailabilityWindow && agent.calendarAvailabilityWindow !== "Ignore") {
      return true;
    }
    return false;
  });
  const [lastPublishedAt, setLastPublishedAt] = useState(() => {
    const raw = initialAgent?.lastPublishedAt;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  });

  const [rankingSignals, setRankingSignals] = useState(() =>
    normalizeRankingSignals(initialAgent?.rankingSignals)
  );
  const agentInstructions = useMemo(
    () => buildAgentInstructionsFromSignals(rankingSignals),
    [rankingSignals]
  );

  // --- Route mode rules
  const FIELD_META = {
    Company: { icon: Building2, pluralLabel: "companies" },
    "Company type": { icon: Briefcase, pluralLabel: "company types" },
    Type: { icon: Folder, pluralLabel: "types" },
    Subtype: { icon: Tag, pluralLabel: "subtypes" },
    Item: { icon: Package, pluralLabel: "items" },
    Agreement: { icon: File, pluralLabel: "agreements" },
  };
  const routeFieldOptions = ROUTE_CONDITION_FIELDS.map((field) => ({
    id: field.toLowerCase().replace(/\s+/g, "-"),
    name: field,
    icon: FIELD_META[field]?.icon || FileText,
    pluralLabel: FIELD_META[field]?.pluralLabel || `${field.toLowerCase()}s`,
    values: (ROUTE_CONDITION_VALUES[field] || []).map((value) => ({
      id: value,
      name: value,
    })),
  }));

  const createRule = (id, boardValue = "", promptValue = "", conditions = []) => ({
    id,
    board: boardValue,
    prompt: promptValue,
    conditions,
  });
  const normalizeCondition = (condition) => {
    if (condition?.version === 2 && condition.fieldId) {
      const field = routeFieldOptions.find((f) => f.id === condition.fieldId);
      const validOps = ["is", "isNot", "isBlank", "isNotBlank"];
      const operator = validOps.includes(condition.operator) ? condition.operator : "is";
      return {
        id: condition.id || newConditionId(),
        version: 2,
        fieldId: field?.id || condition.fieldId,
        operator,
        valueIds: Array.isArray(condition.valueIds) ? condition.valueIds : [],
      };
    }

    return {
      id: condition?.id || newConditionId(),
      version: 2,
      fieldId: routeFieldOptions[0]?.id ?? "",
      operator: "is",
      valueIds: [],
    };
  };

  const [rules, setRules] = useState(
    initialAgent?.routeRules?.length
      ? initialAgent.routeRules.map((rule, i) =>
          createRule(
            rule.id ?? i + 1,
            rule.board ?? "",
            rule.prompt ?? "",
            (rule.conditions ?? []).map(normalizeCondition)
          )
        )
      : initialAgent?.destinations?.length
      ? initialAgent.destinations.map((b, i) => createRule(i + 1, b))
      : [createRule(1)]
  );
  const addRule = () =>
    setRules((r) => [...r, createRule(Date.now())]);
  const updateRule = (id, patch) =>
    setRules((r) =>
      r.map((rule) => {
        if (rule.id !== id) return rule;
        const nextRule = { ...rule, ...patch };
        if (Object.prototype.hasOwnProperty.call(patch, "conditions")) {
          nextRule.conditions = patch.conditions.map(normalizeCondition);
        }
        return nextRule;
      })
    );
  const removeRule = (id) =>
    setRules((r) => r.filter((rule) => rule.id !== id));

  const rulePlaceholder =
    "Add anything to help the agent route tickets to this board. Instructions you add here will be considered in addition to the agent's context.";

  // ---------------------------------------------------------------------------
  // Conflict detection
  //
  // Teams are exclusive per dispatch scope and per agent. Boards can overlap
  // across scopes when company/tsi filters differentiate intake.
  // ---------------------------------------------------------------------------
  const otherAgents = agents.filter((a) => a.id !== editingAgentId);
  const assignmentAgents = otherAgents.filter(
    (a) => a.mode === "Assign" || a.mode === "Assign + Schedule"
  );

  const claimedBoards = new Map();
  assignmentAgents.forEach((a) => {
    normalizeSelections(a.boards ?? a.board).forEach((b) =>
      claimedBoards.set(b, a.name || "another agent")
    );
  });

  const boardClaimedByAgent = Object.fromEntries(claimedBoards);

  const claimedTeams = new Map();
  assignmentAgents.forEach((agent) => {
    const agentTeams = Array.isArray(agent.teamScopes)
      ? agent.teamScopes.flatMap((scope) =>
          normalizeSelections(scope.teams ?? scope.team)
        )
      : normalizeSelections(agent.teams ?? agent.team);
    agentTeams.forEach((team) => claimedTeams.set(team, agent.name || "another agent"));
  });
  const teamClaimedByAgent = Object.fromEntries(claimedTeams);

  const ruleErrors = {};
  if (isRoute) {
    rules.forEach((rule) => {
      if (!rule.board) return;
      if (boards.includes(rule.board)) {
        ruleErrors[rule.id] = "Can't route to the same board you're routing from.";
      }
    });
  }

  const teams = useMemo(
    () =>
      teamScopes.flatMap((scope) => normalizeSelections(scope.teams ?? scope.team)),
    [teamScopes]
  );
  const scopeViews = useMemo(
    () => teamScopes.flatMap((scope) => getScopeViews(scope)),
    [teamScopes]
  );
  const perTeamLimitsActive = perTeamLimitsEnabled && teams.length > 1;
  const effectiveMaxActiveThreads = useMemo(() => {
    if (!perTeamLimitsActive) return maxActiveThreads;
    return Object.fromEntries(
      teams.map((team) => [team, teamMaxActiveThreads[team] ?? maxActiveThreads])
    );
  }, [perTeamLimitsActive, teams, teamMaxActiveThreads, maxActiveThreads]);
  const disabledTeamClaimsByScopeId = useMemo(() => {
    const claimsByScopeId = {};
    teamScopes.forEach((scope) => {
      const claims = { ...teamClaimedByAgent };
      teamScopes
        .filter((otherScope) => otherScope.id !== scope.id)
        .forEach((otherScope) => {
          normalizeSelections(otherScope.teams ?? otherScope.team).forEach((team) => {
            claims[team] = "another dispatch scope";
          });
        });
      claimsByScopeId[scope.id] = claims;
    });
    return claimsByScopeId;
  }, [teamScopes, teamClaimedByAgent]);

  const removeTeamScope = (id) =>
    setTeamScopes((prev) => prev.filter((scope) => scope.id !== id));

  const hasErrors = Object.keys(ruleErrors).length > 0;
  const missingRequired =
    (isRoute
      ? boards.length === 0
      : teamScopes.length === 0 ||
        teamScopes.some((scope) => !isTeamScopeConfigured(scope))) ||
    !agentDisplayName.trim();
  const multiTeamScopesValid = teamScopes.every(isMultiTeamScopeValid);
  const canSave = !hasErrors && !missingRequired && multiTeamScopesValid;

  const updateTeamScope = (id, patch) => {
    setTeamScopes((prev) =>
      prev.map((scope) => (scope.id === id ? { ...scope, ...patch } : scope))
    );
  };

  const handleSaveClick = () => {
    const primaryScope = teamScopes[0];
    const publishedAt = new Date();
    setLastPublishedAt(publishedAt);
    onSave({
      name: agentDisplayName.trim(),
      avatarId,
      mode,
      board: isRoute ? boards[0] || "" : scopeViews[0] || "",
      boards: isRoute ? boards : scopeViews,
      team: isRoute ? null : teams[0] || null,
      teams: isRoute ? [] : teams,
      teamScopes: isRoute ? undefined : teamScopes,
      dispatchMode: isRoute ? undefined : dispatchMode,
      maxActiveThreads: isRoute ? undefined : maxActiveThreads,
      perTeamLimitsEnabled: isRoute ? undefined : perTeamLimitsActive,
      teamMaxActiveThreads: isRoute || !perTeamLimitsActive ? undefined : effectiveMaxActiveThreads,
      maxActiveThreadsStatuses: isRoute
        ? undefined
        : Array.from(new Set(Object.values(boardExtraStatuses).flat())),
      calendarAvailabilityEnabled: isRoute ? undefined : calendarAvailabilityEnabled,
      calendarAvailability: isRoute
        ? undefined
        : calendarAvailabilityEnabled
          ? "Today and tomorrow"
          : "Ignore",
      excludeTechs,
      excludeTechsEnabled: excludeTechs.length > 0,
      skipFlowAssignedTickets: false,
      fallbackStatus:
        isRoute || dispatchMode !== "Auto-assign" || noTechAction === "Retry assignment"
          ? "No change"
          : primaryScope?.fallbackStatus ?? "Escalation",
      destinations: isRoute ? rules.map((r) => r.board).filter(Boolean) : [],
      routeRules: isRoute ? rules : undefined,
      agentInstructions: isRoute
        ? undefined
        : dispatchMode === "Auto-assign"
          ? DEFAULT_ASSIGN_AGENT_INSTRUCTIONS
          : agentInstructions,
      rankingSignals: isRoute ? undefined : rankingSignals,
      statuses: isRoute
        ? statuses
        : flattenBoardStatuses(primaryScope?.boardStatuses ?? {}),
      statusMode: isRoute ? statusMode : "Include only",
      active,
      lastPublishedAt: publishedAt.toISOString(),
    });
  };

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#FAF9F6]">
      <header className="relative z-20 flex shrink-0 items-center justify-between bg-white px-6 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onBack}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="truncate text-xl font-normal text-neutral-900">
            Configure auto-dispatch
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setTestPanelOpen((open) => !open)}
            aria-expanded={testPanelOpen}
            className={`inline-flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-sm font-medium transition-colors ${
              testPanelOpen
                ? "border-[#00BB99] bg-white text-[#00BB99]"
                : "border-[#00BB99] bg-white text-[#00BB99] hover:bg-teal-50"
            }`}
          >
            <Play
              size={14}
              className="text-[#00BB99]"
              aria-hidden
            />
            Test run
          </button>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-8 py-10">

        {!isRoute && (
          <div className="mb-10">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-neutral-900">Auto dispatch mode</h2>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setDispatchMode("Auto-assign")}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition-colors ${
                    dispatchMode === "Auto-assign"
                      ? "border-teal-500"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <Users size={18} className="shrink-0 text-neutral-400" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-neutral-900">Auto-assign</div>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      Threads are assigned automatically
                    </p>
                  </div>
                  {dispatchMode === "Auto-assign" ? (
                    <Check size={16} className="shrink-0 text-teal-600" strokeWidth={2.5} />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchMode("Next thread")}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition-colors ${
                    dispatchMode === "Next thread"
                      ? "border-teal-500"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <ListOrdered size={18} className="shrink-0 text-neutral-400" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-neutral-900">Next thread</div>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      Techs request threads when ready
                    </p>
                  </div>
                  {dispatchMode === "Next thread" ? (
                    <Check size={16} className="shrink-0 text-teal-600" strokeWidth={2.5} />
                  ) : null}
                </button>
              </div>
            </div>
          </div>
        )}

        <Section title="Dispatcher identity">
          <Row
            label="Name your dispatcher"
            subcopy="Helps identify the dispatcher once it's set up"
          >
            <input
              type="text"
              value={agentDisplayName}
              onChange={(e) => setAgentDisplayName(e.target.value)}
              placeholder="e.g Team Red Dispatcher"
              className="min-w-[240px] max-w-xs rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </Row>
          <Row
            label="Avatar"
            subcopy="Helps identify the dispatcher once it's set up"
            noBorder
          >
            <div className="relative" ref={avatarPickerWrapRef}>
              <button
                type="button"
                onClick={() => setAvatarPickerOpen((o) => !o)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white p-0.5 transition-colors hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                aria-expanded={avatarPickerOpen}
                aria-haspopup="listbox"
                aria-label="Choose dispatcher avatar"
              >
                <span
                  className={`h-6 w-6 shrink-0 rounded-full ${avatarSwatchClass(avatarId)}`}
                  aria-hidden
                />
              </button>
              {avatarPickerOpen ? (
                <div
                  role="listbox"
                  className="absolute right-0 z-30 mt-2 w-[200px] rounded-lg border border-neutral-200 bg-white p-2 shadow-lg"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {AGENT_AVATAR_PRESETS.map((preset) => {
                      const picked = preset.id === avatarId;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          role="option"
                          aria-selected={picked}
                          onClick={() => {
                            setAvatarId(preset.id);
                            setAvatarPickerOpen(false);
                          }}
                          className={`flex h-14 w-full items-center justify-center rounded-md border p-1.5 transition-colors ${
                            picked
                              ? "border-emerald-500 ring-2 ring-emerald-500/25"
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <span
                            className={`h-10 w-10 rounded-full ${preset.swatch}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </Row>
        </Section>

        {/* Agent scope */}
        {isRoute ? (
          <Section
            title="Agent scope"
            subcopy="Set the intake board this agent monitors."
          >
            <Row
              label="Dispatch from"
              subcopy="Select the intake board to route tickets from."
            >
              <MultiSelect
                values={boards}
                options={BOARDS}
                onChange={setBoards}
                placeholder="Select boards"
                searchable
                searchPlaceholder="Search boards..."
                dropdownClassName="w-[320px] max-h-[30rem]"
                disabledClaims={boardClaimedByAgent}
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
                  placeholder="Select status"
                  searchable
                  searchPlaceholder="Search statuses..."
                  dropdownClassName="w-[320px]"
                  menuMaxHeight={STATUS_MENU_MAX_HEIGHT}
                  withSelectAll
                />
              </div>
            </Row>
          </Section>
        ) : (
          <div className="mb-10">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-neutral-900">
                Dispatch scope
              </h2>
            </div>
            {dispatchMode === "Auto-assign" && !flowsConflictBannerDismissed ? (
              <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <Info size={16} className="shrink-0 text-blue-600" aria-hidden />
                <p className="min-w-0 flex-1 text-sm text-blue-900">
                  Auto-assign may conflict with Flows that assign members.
                </p>
                <a
                  href="#"
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
                  onClick={(event) => event.preventDefault()}
                >
                  Open Flows
                  <ArrowUpRight size={12} strokeWidth={2.25} aria-hidden />
                </a>
                <button
                  type="button"
                  onClick={() => setFlowsConflictBannerDismissed(true)}
                  className="shrink-0 rounded p-0.5 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}
            <div className="space-y-3">
              {teamScopes.map((scope) => (
                <AgentScopeTeamCard
                  key={scope.id}
                  scope={scope}
                  disabledTeamClaims={disabledTeamClaimsByScopeId[scope.id] ?? {}}
                  showExcludeTechs={dispatchMode === "Auto-assign"}
                  excludeTechs={excludeTechs}
                  onExcludeTechsChange={setExcludeTechs}
                  onRemove={
                    teamScopes.length > 1 ? () => removeTeamScope(scope.id) : undefined
                  }
                  onUpdate={(patch) => updateTeamScope(scope.id, patch)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Route mode: rules */}
        {isRoute && (
          <div className="mb-10">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">Routing rules</h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Add a rule for each board you want to route tickets to. The agent reads all rules
                  together and picks the best fit for each ticket.
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                <AgentContextPopover />
              </div>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => {
                const availableBoards = BOARDS.filter(
                  (b) =>
                    !boards.includes(b) &&
                    (b === rule.board ||
                      !rules.some((r) => r.id !== rule.id && r.board === b))
                );
                const error = ruleErrors[rule.id];
                return (
                  <div
                    key={rule.id}
                    className={`bg-white border rounded-lg shadow-sm ${
                      error ? "border-red-300" : "border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between px-5 py-3 relative after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-[#DAD9DD] bg-white rounded-t-lg">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-neutral-700">
                          Dispatch to
                        </span>
                        <Select
                          value={rule.board}
                          options={availableBoards}
                          onChange={(b) => updateRule(rule.id, { board: b })}
                          searchable
                          searchPlaceholder="Search boards..."
                          triggerClassName="h-7 py-0"
                          dropdownClassName="w-[280px] max-h-[30rem]"
                        />
                        <span className="text-sm text-neutral-700">
                          when...
                        </span>
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
                Add dispatch route
              </button>

            </div>
          </div>
        )}

        {/* Working hours — Assign+Schedule only */}
        {isSchedule && (
          <Section
            title="Working hours and scheduling"
            subcopy="Control the hours and time windows the agent operates within."
          >
            <Row
              label="Working hours"
              subcopy="The hours during which new tickets will be automatically dispatched to this team. Time zone is pulled from your workspace settings."
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
          </Section>
        )}

        {/* Technician assignment — Auto-assign only */}
        {!isRoute && dispatchMode === "Auto-assign" && (
          <>
<Section
              title="Technician assignment"
              subcopy="Define how threads are assigned to technicians."
            >
              <div className="relative after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-[#DAD9DD] px-5 py-4">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-neutral-900">
                      Max active threads
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                      A tech stops receiving threads once their active count reaches this number.
                      Set which statuses count by board below.
                    </p>
                  </div>
                  <Select
                    value={maxActiveThreads}
                    options={MAX_ACTIVE_THREADS_OPTIONS}
                    onChange={setMaxActiveThreads}
                    disabled={perTeamLimitsActive}
                    menuMinWidth={SCOPE_DROPDOWN_MIN_WIDTH}
                  />
                </div>
                {teams.length > 1 ? (
                  <div className="mt-4 flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-neutral-900">
                        Set different limits per Inbox Team
                      </div>
                      <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                        Override the max active threads per team
                      </p>
                    </div>
                    <Switch
                      checked={perTeamLimitsEnabled}
                      onCheckedChange={(checked) => {
                        setPerTeamLimitsEnabled(checked);
                        if (checked) {
                          setTeamMaxActiveThreads(
                            Object.fromEntries(teams.map((team) => [team, maxActiveThreads]))
                          );
                        }
                      }}
                    />
                  </div>
                ) : null}
                {perTeamLimitsActive ? (
                  <ScopeNestedGroup className="!space-y-3">
                    {teams.map((team) => (
                      <div key={team} className="flex items-center justify-between gap-6">
                        <div className="min-w-0 flex-1 text-sm font-medium text-neutral-900">
                          {team}
                        </div>
                        <Select
                          value={teamMaxActiveThreads[team] ?? maxActiveThreads}
                          options={MAX_ACTIVE_THREADS_OPTIONS}
                          onChange={(value) =>
                            setTeamMaxActiveThreads((prev) => ({ ...prev, [team]: value }))
                          }
                          menuMinWidth={SCOPE_DROPDOWN_MIN_WIDTH}
                        />
                      </div>
                    ))}
                  </ScopeNestedGroup>
                ) : null}
                {scopeViews.length > 0 ? (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-neutral-900">
                      Define active statuses by board
                    </div>
                  <ScopeNestedGroup>
                    {scopeViews.map((board) => {
                      const lockedStatuses = normalizeSelections(
                        teamScopes[0]?.boardStatuses?.[board]
                      );
                      const extraStatuses = (boardExtraStatuses[board] ?? []).filter(
                        (status) => !lockedStatuses.includes(status)
                      );
                      const selectedStatuses = [...lockedStatuses, ...extraStatuses];
                      return (
                        <div key={board} className="flex items-start justify-between gap-6">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-neutral-900">{board}</div>
                            <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                              Statuses that count toward a tech&apos;s active thread limit.
                            </p>
                          </div>
                          <MultiSelect
                            values={selectedStatuses}
                            lockedValues={lockedStatuses}
                            options={getBoardStatusOptions(board)}
                            onChange={(next) =>
                              setBoardExtraStatuses((prev) => ({
                                ...prev,
                                [board]: next.filter((status) => !lockedStatuses.includes(status)),
                              }))
                            }
                            placeholder="Select status"
                            searchable
                            searchPlaceholder="Search statuses"
                            summaryLabel={
                              selectedStatuses.length === 0
                                ? undefined
                                : selectedStatuses.length === 1
                                  ? selectedStatuses[0]
                                  : `${selectedStatuses.length} selected`
                            }
                            menuMinWidth={SCOPE_DROPDOWN_MIN_WIDTH}
                          />
                        </div>
                      );
                    })}
                  </ScopeNestedGroup>
                  </div>
                ) : null}
              </div>
              <div className="relative after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-[#DAD9DD] px-5 py-4">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-neutral-900">
                      Action when no tech is available
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                      {noTechAction === "Retry assignment"
                        ? "Retries every minute, prioritizing threads by highest priority and oldest"
                        : "Changes the thread status when no one is eligible"}
                    </p>
                  </div>
                  <Select
                    value={noTechAction}
                    options={["Retry assignment", "Apply a status change"]}
                    onChange={setNoTechAction}
                  />
                </div>
                {noTechAction === "Apply a status change" && scopeViews.length > 0 ? (
                  <ScopeNestedGroup>
                    {scopeViews.map((board) => {
                      const fallback = boardFallbackStatuses[board] ?? "";
                      return (
                        <div key={board} className="flex items-start justify-between gap-6">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-neutral-900">{board}</div>
                            <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                              Select the status threads will move to on this board.
                            </p>
                            {!fallback ? (
                              <p className="mt-1 flex items-center gap-1.5 text-sm text-red-800">
                                <AlertTriangle size={14} strokeWidth={2} aria-hidden />
                                Select a fallback status.
                              </p>
                            ) : null}
                          </div>
                          <Select
                            value={fallback}
                            options={getBoardFallbackStatusOptions(board)}
                            onChange={(status) => {
                              setBoardFallbackStatuses((prev) => ({ ...prev, [board]: status }));
                              if (board === scopeViews[0]) {
                                updateTeamScope(teamScopes[0].id, { fallbackStatus: status });
                              }
                            }}
                            placeholder="Select status"
                            menuMinWidth={SCOPE_DROPDOWN_MIN_WIDTH}
                          />
                        </div>
                      );
                    })}
                  </ScopeNestedGroup>
                ) : null}
              </div>
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-neutral-900">Enable scheduling</div>
                    <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                      Automatically picks an open time on the assigned member&apos;s Planner.
                    </p>
                  </div>
                  <Switch
                    checked={calendarAvailabilityEnabled}
                    onCheckedChange={setCalendarAvailabilityEnabled}
                  />
                </div>
                {calendarAvailabilityEnabled ? (
                  <ScopeNestedGroup>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-900">
                      <span>Schedule with at least</span>
                      <input
                        type="number"
                        min={1}
                        value={scheduleNoticeAmount}
                        onChange={(e) => setScheduleNoticeAmount(e.target.value)}
                        placeholder="#"
                        className="w-[60px] rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <Select
                        value={scheduleNoticeUnit}
                        options={["minutes", "hours"]}
                        onChange={setScheduleNoticeUnit}
                        menuMinWidth={140}
                      />
                      <span>notice.</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-900">
                      <span>Default booking duration</span>
                      <input
                        type="number"
                        min={1}
                        value={bookingDurationAmount}
                        onChange={(e) => setBookingDurationAmount(e.target.value)}
                        placeholder="#"
                        className="w-[60px] rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <Select
                        value={bookingDurationUnit}
                        options={["minutes", "hours"]}
                        onChange={setBookingDurationUnit}
                        menuMinWidth={140}
                      />
                    </div>
                  </ScopeNestedGroup>
                ) : null}
              </div>
            </Section>

            <Section title="Status automation">
              <div className="px-5 py-4">
                <p className="text-sm text-neutral-700">
                  Automatically update a thread&apos;s status when it&apos;s assigned via
                  Auto-dispatch.
                </p>
                <a
                  href="#"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#00BB99] hover:text-[#00967A]"
                  onClick={(event) => event.preventDefault()}
                >
                  Configure in Status Mapping
                  <ArrowUpRight size={14} strokeWidth={2.25} aria-hidden />
                </a>
              </div>
            </Section>
          </>
        )}

        {/* Thread scoring — Next thread only */}
        {!isRoute && dispatchMode === "Next thread" && (
          <RankingSignalsSection signals={rankingSignals} onChangeSignals={setRankingSignals} />
        )}

        {/* Save / Cancel */}
        <div className="flex flex-col items-end gap-2 pb-12">
          {hasErrors && (
            <div className="text-xs text-red-600">
              Resolve the highlighted conflicts before saving.
            </div>
          )}
          <div className="flex w-full items-center justify-end gap-3">
            {lastPublishedAt ? (
              <span className="mr-auto text-xs text-neutral-400">
                {formatLastSaved(lastPublishedAt)}
              </span>
            ) : null}
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
        </div>

        {testPanelOpen ? (
          <aside
            aria-hidden={false}
            style={{ width: testPanelWidth }}
            className={`relative flex h-full shrink-0 flex-col overflow-hidden border-l border-neutral-200 bg-white ${
              !isResizingTestPanel ? "transition-[width] duration-300 ease-in-out" : ""
            }`}
          >
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize test panel"
              aria-valuemin={TEST_PANEL_MIN_WIDTH}
              aria-valuemax={TEST_PANEL_MAX_WIDTH}
              aria-valuenow={testPanelWidth}
              onMouseDown={handleTestPanelResizeStart}
              className={`absolute inset-y-0 -left-2 z-20 w-4 cursor-col-resize touch-none ${
                isResizingTestPanel ? "bg-emerald-500/10" : ""
              }`}
            />
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <TestAgentPanel
                configuredTeams={teams}
                agentInstructions={
                  dispatchMode === "Auto-assign"
                    ? DEFAULT_ASSIGN_AGENT_INSTRUCTIONS
                    : agentInstructions
                }
                rankingSignals={rankingSignals}
                outputMode={
                  dispatchMode === "Auto-assign" ? "recommendation" : "points"
                }
                maxActiveThreads={effectiveMaxActiveThreads}
                calendarAvailabilityEnabled={calendarAvailabilityEnabled}
                excludeTechs={excludeTechs}
                fallbackStatus={
                  noTechAction === "Retry assignment"
                    ? "No change"
                    : teamScopes[0]?.fallbackStatus || "Escalation"
                }
                onClose={() => setTestPanelOpen(false)}
              />
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}

// =============================================================================
// ROOT
// =============================================================================

/** New agents from "Create agent" open in config without a mode picker. */
const DEFAULT_NEW_AGENT_MODE = "Assign";

export default function App() {
  const [section, setSection] = useState("Auto-dispatch"); // "Auto-dispatch" | "Flows" | "SLAs"
  const slaNavGuardRef = useRef(null);
  const [view, setView] = useState("list"); // "list" | "config"
  const [mode, setMode] = useState(null);
  const [agents, setAgents] = useState([]);
  const [editingAgentId, setEditingAgentId] = useState(null);

  const handleCreateAgent = () => {
    setMode(DEFAULT_NEW_AGENT_MODE);
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

  const handleToggleActive = (id) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const editingAgent = editingAgentId
    ? agents.find((a) => a.id === editingAgentId) || null
    : null;

  const handleSectionSelect = (label) => {
    if (label === section) return;
    if (section === "SLAs" && slaNavGuardRef.current) {
      slaNavGuardRef.current(label, () => setSection(label));
      return;
    }
    setSection(label);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex h-screen overflow-hidden font-sans text-neutral-900 bg-[#FAF9F6]"
        style={{
          fontFamily:
            "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <Sidebar active={section} onSelect={handleSectionSelect} />

      {section === "Auto-dispatch" && (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {view === "list" && (
            <AgentListPage
              agents={agents}
              onCreate={handleCreateAgent}
              onOpenAgent={handleOpenAgent}
              onDeleteAgent={handleDeleteAgent}
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
        </div>
      )}

        {section === "Flows" && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <FlowsPage onBack={() => setSection("Auto-dispatch")} />
          </div>
        )}

        {section === "SLAs" && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <SlasPage
              onRegisterNavGuard={(guard) => {
                slaNavGuardRef.current = guard;
              }}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
