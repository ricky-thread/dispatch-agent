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
  Briefcase,
  Building2,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  File,
  FileText,
  Folder,
  Globe,
  HelpCircle,
  Inbox,
  Info,
  LayoutGrid,
  Lock,
  MessageSquare,
  ListOrdered,
  Code2,
  MoreHorizontal,
  Package,
  Pencil,
  Play,
  Phone,
  Plug,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Target,
  Trash2,
  TriangleAlert,
  ArrowUpRight,
  Users,
  Wallet,
  Wand2,
  Workflow,
  X,
  Zap,
} from "lucide-react";

import {
  BOARDS,
  BOARD_DISPATCH_STATUSES,
  DISPATCH_STATUS_OPTIONS,
  STATUSES,
  TEAMS,
  HOUR_OPTIONS,
  ROUTE_CONDITION_FIELDS,
  ROUTE_CONDITION_VALUES,
} from "./constants";

/** Status menus: default dropdown height + 200px */
const STATUS_MENU_MAX_HEIGHT = "min(46.5rem, calc(100vh - 6rem))";

const DEFAULT_ASSIGN_AGENT_INSTRUCTIONS = `Prioritize tickets in the following order:
1. VIP contacts should always be ranked first, regardless of ticket priority or age.
2. Tickets with unanswered customer replies should rank above tickets with no recent activity.
3. Rank higher priority tickets above lower priority ones when contact type is equal.
4. When priority and reply status are equal, older tickets rank first.

Custom rules:
- Tickets from managed services agreements should rank above break fix tickets of equal priority.`;

function formatLastPublished(date) {
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.getDate();
  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `Last published ${month} ${day} at ${time}`;
}
const SCOPE_BOARD_OPTIONS = ["Help Desk", "Network", "Projects", "Voice"];
const SCOPE_FILTER_METADATA = {
  "Company type": {
    icon: Building2,
    values: ["Managed Service", "Break Fix", "Internal", "Government"],
  },
  "Contact type": {
    icon: Users,
    values: ["Standard", "VIP", "Executive"],
  },
  "Agreement type": {
    icon: FileText,
    values: [
      "Block Time - One time",
      "Block Time - Recurring",
      "Managed Service",
      "Monitoring",
      "Time and materials",
    ],
  },
  Territory: {
    icon: Globe,
    values: ["North", "South", "East", "West"],
  },
};
const SCOPE_FILTER_OPTIONS = Object.keys(SCOPE_FILTER_METADATA);

const normalizeSelections = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
};

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

function Select({
  value,
  options,
  onChange,
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  placeholder = "Select",
  searchable = false,
  searchPlaceholder = "Type to filter...",
  menuMaxHeight,
  menuWidth,
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
        className={`fixed bg-white border border-neutral-200 rounded-md shadow-lg py-1 z-[200] overflow-y-auto ${menuMaxHeight ? "" : "max-h-64"} ${dropdownClassName}`}
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          ...(menuWidth
            ? { width: menuWidth }
            : { minWidth: menuPosition.minWidth }),
          ...(menuMaxHeight ? { maxHeight: menuMaxHeight } : undefined),
        }}
      >
        {searchable && (
          <div className="sticky top-0 bg-white px-2 pb-2 pt-1 border-b border-neutral-100">
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 px-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        )}
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
        <span className={`truncate ${isEmpty ? "text-neutral-400" : "text-neutral-800"}`}>
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
  searchPlaceholder = "Type to filter...",
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
  showCount = false,
  totalCount = null,
  showChips = false,
  /** When false, trigger only shows placeholder; selections are shown elsewhere (e.g. chip row). */
  selectionInTrigger = true,
  menuMaxHeight = "min(34rem, calc(100vh - 6rem))",
  menuWidth,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState(null);
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
        className={`fixed z-[200] flex flex-col bg-white border border-neutral-200 rounded-md shadow-lg ${dropdownClassName}`}
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          ...(menuWidth ? { width: menuWidth } : { minWidth: menuPosition.minWidth }),
          maxHeight: menuMaxHeight,
        }}
      >
        {searchable && (
          <div className="px-2 pb-2 pt-1 border-b border-neutral-100 shrink-0">
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 px-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        )}
        <div className="flex-1 overflow-y-auto py-1 min-h-0">
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
                    {usedByAgentName ? (
                      <Lock
                        size={13}
                        className="shrink-0 text-neutral-400"
                        strokeWidth={2}
                        aria-hidden
                      />
                    ) : (
                      <span className="shrink-0 text-[11px] font-medium text-neutral-400">
                        In use
                      </span>
                    )}
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
                  <span className={`min-w-0 flex-1 truncate ${selected ? "font-semibold" : ""}`}>
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
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700 max-w-[170px]"
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

/** Chips + inline filter inside one bordered control; dropdown lists members on focus/click. */
function ExcludeTechsCombo({
  values,
  onChange,
  options,
  disabled,
  disabledMessage = "Select teams first",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMembers = useMemo(
    () => options.filter((m) => m.toLowerCase().includes(normalizedQuery)),
    [options, normalizedQuery]
  );

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const toggleMember = (member) => {
    if (values.includes(member)) {
      onChange(values.filter((v) => v !== member));
    } else {
      onChange([...values, member]);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={`flex w-full min-h-[42px] items-stretch gap-2 rounded-md border bg-white px-2 py-1.5 transition-shadow ${
          disabled
            ? "cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-75"
            : `cursor-text border-neutral-200 hover:border-neutral-300 ${
                open ? "border-emerald-500 ring-2 ring-emerald-500/20" : ""
              }`
        }`}
        onMouseDown={(e) => {
          if (disabled) return;
          if (e.target.closest("[data-chip-remove]")) return;
          e.preventDefault();
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        <div className="flex min-h-[28px] min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {values.map((member) => (
            <span
              key={member}
              className="inline-flex max-w-[240px] items-center gap-1 rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800"
            >
              <span className="truncate">{member}</span>
              <button
                type="button"
                data-chip-remove
                className="shrink-0 rounded p-0.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(values.filter((v) => v !== member));
                }}
                aria-label={`Remove ${member}`}
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (!disabled) setOpen(true);
            }}
            placeholder={
              disabled
                ? disabledMessage
                : values.length === 0
                  ? "Search members…"
                  : "Filter…"
            }
            className="min-w-[96px] flex-1 bg-transparent py-1 pl-1 pr-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
        {!disabled && options.length > 0 ? (
          <div className="flex shrink-0 items-center border-l border-neutral-200 pl-2">
            <span className="whitespace-nowrap text-xs tabular-nums text-neutral-500">
              {values.length} / {options.length}
            </span>
          </div>
        ) : null}
      </div>

      {open && !disabled ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-64 overflow-y-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {filteredMembers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-500">No matching members</div>
          ) : (
            filteredMembers.map((member) => {
              const selected = values.includes(member);
              return (
                <button
                  key={member}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggleMember(member);
                    inputRef.current?.focus();
                  }}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {selected ? <Check size={11} className="text-white" strokeWidth={3} /> : null}
                  </span>
                  <span className={`min-w-0 flex-1 truncate ${selected ? "font-semibold" : ""}`}>
                    {member}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Route rule conditions (v3):
 * v2 shape stored on each rule:
 * { id, version: 2, fieldId, operator: "is" | "isNot" | "isBlank" | "isNotBlank", valueIds: string[] }
 *
 * UI:
 *  - "Add condition" opens a field picker (with icons).
 *  - Each condition renders as a pill: [icon + field] [operator] [value label or "..."] [X].
 *  - Clicking the operator segment opens an operator menu with a check on the active one.
 *  - Clicking the value segment opens a searchable checklist. Closing with nothing selected removes the pill.
 */

const OPERATOR_LABELS = {
  is: "is",
  isNot: "is not",
  isBlank: "Is blank",
  isNotBlank: "Is not blank",
};
const OPERATOR_OPTIONS = ["is", "isNot", "isBlank", "isNotBlank"];
const OPERATOR_NEEDS_VALUE = (op) => op === "is" || op === "isNot";

function RouteRuleConditionsEditor({ fields, conditions = [], onChange }) {
  const wrapperRef = useRef(null);
  const onChangeRef = useRef(onChange);

  // `openMenu`: { kind: "field" } | { kind: "operator", conditionId } | { kind: "value", conditionId } | null
  const [openMenu, setOpenMenu] = useState(null);
  const [valueSearch, setValueSearch] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const fieldById = useMemo(() => {
    const map = new Map();
    fields.forEach((f) => map.set(f.id, f));
    return map;
  }, [fields]);

  const availableFields = useMemo(
    () => fields.filter((f) => !conditions.some((c) => c.fieldId === f.id)),
    [fields, conditions]
  );

  const emit = (next) => onChangeRef.current?.(next);

  useEffect(() => {
    const closeAndCleanup = () => {
      if (openMenu?.kind === "value") {
        const cleaned = conditions.filter(
          (c) => !OPERATOR_NEEDS_VALUE(c.operator) || (c.valueIds || []).length > 0
        );
        if (cleaned.length !== conditions.length) {
          onChangeRef.current?.(cleaned);
        }
      }
      setOpenMenu(null);
      setValueSearch("");
    };
    const onMouseDown = (event) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target)) return;
      closeAndCleanup();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeAndCleanup();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu, conditions]);

  useEffect(() => {
    if (openMenu?.kind === "value" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [openMenu]);

  const addCondition = (field) => {
    const nextCondition = {
      id: newConditionId(),
      version: 2,
      fieldId: field.id,
      operator: "is",
      valueIds: [],
    };
    emit([...conditions, nextCondition]);
    // Immediately open its value menu.
    setOpenMenu({ kind: "value", conditionId: nextCondition.id });
    setValueSearch("");
  };

  const updateCondition = (conditionId, patch) => {
    emit(conditions.map((c) => (c.id === conditionId ? { ...c, ...patch } : c)));
  };

  const removeCondition = (conditionId) => {
    emit(conditions.filter((c) => c.id !== conditionId));
    if (openMenu?.conditionId === conditionId) {
      setOpenMenu(null);
    }
  };

  const toggleValueId = (condition, valueId) => {
    const current = condition.valueIds || [];
    const next = current.includes(valueId)
      ? current.filter((id) => id !== valueId)
      : [...current, valueId];
    updateCondition(condition.id, { valueIds: next });
  };

  const selectOperator = (condition, nextOperator) => {
    const patch = { operator: nextOperator };
    if (!OPERATOR_NEEDS_VALUE(nextOperator)) {
      patch.valueIds = [];
    }
    updateCondition(condition.id, patch);
    setOpenMenu(null);
  };

  const valueLabelFor = (condition) => {
    if (!OPERATOR_NEEDS_VALUE(condition.operator)) return null;
    const field = fieldById.get(condition.fieldId);
    const values = field?.values || [];
    const selected = values.filter((v) => (condition.valueIds || []).includes(v.id));
    if (selected.length === 0) return "...";
    if (selected.length === 1) return selected[0].name;
    return `${selected.length} ${field?.pluralLabel || "selected"}`;
  };

  return (
    <div ref={wrapperRef} className="flex items-center gap-2 flex-wrap relative">
      {conditions.map((condition) => {
        const field = fieldById.get(condition.fieldId);
        const fieldName = field?.name || "Unknown";
        const FieldIcon = field?.icon || FileText;
        const operatorLabel = OPERATOR_LABELS[condition.operator] || "is";
        const showValueSegment = OPERATOR_NEEDS_VALUE(condition.operator);
        const valueLabel = valueLabelFor(condition);
        const values = field?.values || [];
        const q = valueSearch.trim().toLowerCase();
        const filteredValues = q
          ? values.filter((v) => v.name.toLowerCase().includes(q))
          : values;
        const isOperatorOpen =
          openMenu?.kind === "operator" && openMenu.conditionId === condition.id;
        const isValueOpen =
          openMenu?.kind === "value" && openMenu.conditionId === condition.id;

        return (
          <div
            key={condition.id}
            className="relative inline-flex h-6 items-stretch rounded-md border border-neutral-300 bg-white text-xs"
          >
            {/* Field segment */}
            <div className="flex items-center gap-1.5 px-2 text-neutral-800 border-r border-neutral-300">
              <FieldIcon size={12} className="text-neutral-500" />
              <span>{fieldName}</span>
            </div>

            {/* Operator segment */}
            <button
              type="button"
              onClick={() => {
                setOpenMenu(
                  isOperatorOpen
                    ? null
                    : { kind: "operator", conditionId: condition.id }
                );
              }}
              className="flex items-center px-2 text-neutral-700 border-r border-neutral-300 hover:bg-neutral-50"
            >
              {operatorLabel}
            </button>

            {/* Value segment */}
            {showValueSegment && (
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(
                    isValueOpen ? null : { kind: "value", conditionId: condition.id }
                  );
                  setValueSearch("");
                }}
                className="flex items-center px-2 text-neutral-800 border-r border-neutral-300 hover:bg-neutral-50 min-w-[32px] text-left"
              >
                {valueLabel}
              </button>
            )}

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeCondition(condition.id)}
              className="flex items-center px-1.5 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
              aria-label={`Remove ${fieldName} condition`}
            >
              <X size={12} />
            </button>

            {/* Operator menu */}
            {isOperatorOpen && (
              <div className="absolute left-0 top-full mt-1 min-w-[200px] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg z-[100]">
                {OPERATOR_OPTIONS.map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => selectOperator(condition, op)}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-neutral-50 ${
                      condition.operator === op ? "bg-neutral-50 text-neutral-900" : "text-neutral-800"
                    }`}
                  >
                    <span>{OPERATOR_LABELS[op]}</span>
                    {condition.operator === op && (
                      <Check size={14} className="text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Value menu */}
            {isValueOpen && (
              <div className="absolute left-0 top-full mt-1 w-[320px] max-h-[420px] flex flex-col rounded-lg border border-neutral-200 bg-white shadow-lg z-[100] overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100">
                  <Search size={14} className="text-neutral-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={valueSearch}
                    onChange={(e) => setValueSearch(e.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 outline-none"
                  />
                </div>
                <div className="flex-1 overflow-auto p-1">
                  {filteredValues.length === 0 ? (
                    <div className="px-2.5 py-3 text-sm text-neutral-400">No matches</div>
                  ) : (
                    filteredValues.map((value) => {
                      const checked = (condition.valueIds || []).includes(value.id);
                      return (
                        <button
                          key={value.id}
                          type="button"
                          onClick={() => toggleValueId(condition, value.id)}
                          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border ${
                              checked
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-neutral-300 bg-white"
                            }`}
                          >
                            {checked && <Check size={12} className="text-white" />}
                          </span>
                          <span className="truncate">{value.name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpenMenu((prev) => (prev?.kind === "field" ? null : { kind: "field" }));
          }}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-emerald-500 px-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
        >
          <Plus size={12} />
          Add condition
        </button>

        {openMenu?.kind === "field" && (
          <div className="absolute left-0 top-full mt-1 min-w-[240px] max-h-[360px] overflow-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-lg z-[100]">
            {availableFields.length === 0 ? (
              <div className="px-2.5 py-2 text-sm text-neutral-500">No more conditions</div>
            ) : (
              availableFields.map((f) => {
                const Icon = f.icon || FileText;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => addCondition(f)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                  >
                    <Icon size={14} className="text-neutral-500" />
                    <span>{f.name}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
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
  const borderCls = noBorder ? "" : "border-b border-neutral-100";
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
      <div className="bg-white border border-neutral-200 rounded-lg">{children}</div>
    </div>
  );
}

function isTeamScopeConfigured(scope) {
  const teams = normalizeSelections(scope.teams ?? scope.team);
  return Boolean(teams.length > 0 && scope.view);
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

function getScopeFilterTypes(scope) {
  const types = new Set();
  const teams = normalizeSelections(scope.teams ?? scope.team);
  teams.forEach((team) => {
    (scope.teamConditions?.[team] || []).forEach((condition) => {
      types.add(condition.filterType);
    });
  });
  if (types.size === 0 && Array.isArray(scope.conditions)) {
    scope.conditions.forEach((condition) => {
      if (condition.filterType && condition.filterType !== "Status") {
        types.add(condition.filterType);
      }
    });
  }
  return [...types];
}

function syncTeamConditionsWithTeams(teams, teamConditions = {}) {
  const filterTypes = getScopeFilterTypes({ teams, teamConditions, conditions: [] });
  const next = {};
  teams.forEach((team) => {
    const existing = teamConditions[team] || [];
    const byType = new Map(existing.map((condition) => [condition.filterType, condition]));
    next[team] = filterTypes.map(
      (filterType) => byType.get(filterType) ?? createTeamCondition({ filterType, valueIds: [] })
    );
  });
  return next;
}

function migrateLegacyScopeConditions(initial = {}) {
  const teams = normalizeSelections(initial.teams ?? initial.team);
  if (initial.teamConditions && typeof initial.teamConditions === "object") {
    return syncTeamConditionsWithTeams(teams, initial.teamConditions);
  }

  const legacyConditions = Array.isArray(initial.conditions) ? initial.conditions : [];
  const filterConditions = legacyConditions
    .filter((condition) => condition.filterType && condition.filterType !== "Status")
    .map((condition) => createTeamCondition(condition));

  const teamConditions = {};
  if (teams.length > 0) {
    teams.forEach((team) => {
      teamConditions[team] = filterConditions.map((condition) =>
        createTeamCondition({
          filterType: condition.filterType,
          valueIds: [...(condition.valueIds || [])],
        })
      );
    });
  }
  return syncTeamConditionsWithTeams(teams, teamConditions);
}

function getBoardStatusOptions(board) {
  if (!board) return [];
  return BOARD_DISPATCH_STATUSES[board] ?? DISPATCH_STATUS_OPTIONS;
}

function getBoardFallbackStatusOptions(board) {
  if (!board) return [];
  const statuses = getBoardStatusOptions(board);
  return ["No change", ...statuses.filter((status) => status !== "No change")];
}

function resolveScopeStatuses(initial = {}) {
  const view = initial.view ?? initial.board ?? "";
  if (!view) return [];

  let statuses = [];
  if (Array.isArray(initial.statuses)) {
    statuses = initial.statuses.filter(Boolean);
  } else if (typeof initial.status === "string" && initial.status) {
    statuses = [initial.status];
  } else {
    const legacyConditions = Array.isArray(initial.conditions) ? initial.conditions : [];
    const statusCondition = legacyConditions.find((condition) => condition.filterType === "Status");
    if (Array.isArray(statusCondition?.valueIds)) {
      statuses = statusCondition.valueIds.filter(Boolean);
    }
  }

  const options = getBoardStatusOptions(view);
  return statuses.filter((status) => options.includes(status));
}

function resolveScopeFallbackStatus(initial = {}) {
  const view = initial.view ?? initial.board ?? "";
  if (!view) return "";

  const options = getBoardFallbackStatusOptions(view);
  const fallbackStatus = initial.fallbackStatus ?? "";
  return options.includes(fallbackStatus) ? fallbackStatus : "";
}

function createTeamScope(id, initial = {}) {
  const teams = normalizeSelections(initial.teams ?? initial.team);
  const view = initial.view ?? initial.board ?? "";
  const configured = isTeamScopeConfigured({ teams, view });
  const teamConditions = migrateLegacyScopeConditions(initial);

  return {
    id,
    teams,
    view,
    teamConditions,
    statuses: resolveScopeStatuses({ ...initial, view }),
    fallbackStatus: resolveScopeFallbackStatus({ ...initial, view }),
    skipFlowAssignedTickets: initial.skipFlowAssignedTickets ?? false,
    expanded: initial.expanded ?? !configured,
  };
}

function getDisabledValuesForTeamField(scope, team, filterType) {
  const disabled = new Set();
  const teams = normalizeSelections(scope.teams ?? scope.team);
  teams.forEach((otherTeam) => {
    if (otherTeam === team) return;
    (scope.teamConditions?.[otherTeam] || [])
      .filter((condition) => condition.filterType === filterType)
      .forEach((condition) => {
        (condition.valueIds || []).forEach((value) => disabled.add(value));
      });
  });
  return disabled;
}

/** Map of filterType → values selected on more than one team in the same scope. */
function getOverlappingValuesByFilterType(scope) {
  const overlaps = new Map();
  const teams = normalizeSelections(scope.teams ?? scope.team);
  if (teams.length < 2) return overlaps;

  const filterTypes = getScopeFilterTypes(scope);
  for (const filterType of filterTypes) {
    const seenValues = new Set();
    const filterOverlaps = new Set();
    for (const team of teams) {
      const condition = (scope.teamConditions?.[team] || []).find(
        (entry) => entry.filterType === filterType
      );
      if (!condition) continue;
      for (const value of condition.valueIds || []) {
        if (seenValues.has(value)) filterOverlaps.add(value);
        seenValues.add(value);
      }
    }
    if (filterOverlaps.size > 0) overlaps.set(filterType, filterOverlaps);
  }
  return overlaps;
}

function hasOverlappingTeamConditions(scope) {
  return getOverlappingValuesByFilterType(scope).size > 0;
}

function isMultiTeamScopeValid(scope) {
  const teams = normalizeSelections(scope.teams ?? scope.team);
  if (teams.length < 2) return true;

  const allConditions = teams.flatMap((team) => scope.teamConditions?.[team] || []);
  if (allConditions.length === 0) return false;
  if (allConditions.some((condition) => !(condition.valueIds || []).length)) return false;

  return !hasOverlappingTeamConditions(scope);
}

function addMirroredCondition(teamConditions, teams, filterType) {
  const next = { ...teamConditions };
  teams.forEach((team) => {
    const existing = next[team] || [];
    if (existing.some((condition) => condition.filterType === filterType)) return;
    next[team] = [...existing, createTeamCondition({ filterType, valueIds: [] })];
  });
  return next;
}

function removeMirroredCondition(teamConditions, teams, filterType) {
  const next = { ...teamConditions };
  teams.forEach((team) => {
    next[team] = (next[team] || []).filter((condition) => condition.filterType !== filterType);
  });
  return next;
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
  const hasTeams = teams.length > 0;
  const hasBoard = Boolean(scope.view);

  if (!hasTeams && !hasBoard) {
    return <span className="font-normal text-[#605F68]">Select team</span>;
  }

  return (
    <>
      {hasTeams ? (
        <span className="font-medium text-neutral-900">{teams.join(", ")}</span>
      ) : (
        <span className="font-normal text-[#605F68]">Select team</span>
      )}
      <span className="text-[#605F68]"> • </span>
      <span className="font-normal text-[#605F68]">
        {hasBoard ? scope.view : "Select board"}
      </span>
    </>
  );
}

function MutualExclusivityNote() {
  return (
    <p className="mt-3 flex items-start gap-1.5 text-sm leading-snug text-sky-700">
      <Info size={14} className="mt-0.5 shrink-0 text-sky-600" strokeWidth={2} aria-hidden />
      <span>Conditions set for each team must be mutually exclusive.</span>
    </p>
  );
}

function ScopeTeamConditionsEditor({
  scope,
  team,
  teams,
  conditions = [],
  teamConditions,
  onUpdateTeamConditions,
  openConditionMenu,
  setOpenConditionMenu,
}) {
  const activeFilterTypes = new Set(getScopeFilterTypes({ teams, teamConditions }));
  const availableFilterOptions = SCOPE_FILTER_OPTIONS.filter(
    (filterType) => !activeFilterTypes.has(filterType)
  );
  const isMultiTeam = teams.length >= 2;
  const overlappingValuesByFilterType = useMemo(
    () => getOverlappingValuesByFilterType(scope),
    [scope]
  );
  const disabledValuesFor = (filterType) =>
    isMultiTeam ? getDisabledValuesForTeamField(scope, team, filterType) : new Set();

  const handleAddFilter = (filterType) => {
    onUpdateTeamConditions(addMirroredCondition(teamConditions, teams, filterType));
    setOpenConditionMenu(null);
  };

  const handleRemoveCondition = (condition) => {
    onUpdateTeamConditions(
      removeMirroredCondition(teamConditions, teams, condition.filterType)
    );
  };

  const handleToggleValue = (condition, value) => {
    const disabled = disabledValuesFor(condition.filterType);
    if (disabled.has(value) && !(condition.valueIds || []).includes(value)) return;
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
    if (values.length === 0) return "Select";
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
        const disabledValues = disabledValuesFor(condition.filterType);
        const overlappingValues =
          overlappingValuesByFilterType.get(condition.filterType) ?? new Set();
        const selectedValues = condition.valueIds || [];
        const hasOverlapOnCondition = selectedValues.some((value) =>
          overlappingValues.has(value)
        );
        const valueMenuOpen =
          openConditionMenu?.kind === "value" &&
          menuTeam === team &&
          menuConditionId === condition.id;
        const hasEmptyValue = !selectedValues.length;

        return (
          <div
            key={condition.id}
            className={`relative inline-flex h-6 items-center rounded-md border text-[12px] ${
              hasOverlapOnCondition
                ? "border-red-300 bg-red-50/70 text-red-900"
                : "border-neutral-300 bg-white text-neutral-800"
            }`}
            aria-invalid={hasOverlapOnCondition || undefined}
          >
            <span
              className={`inline-flex items-center gap-1 border-r px-2 py-[3px] ${
                hasOverlapOnCondition ? "border-red-200" : "border-neutral-300"
              }`}
            >
              <FilterIcon size={12} className="text-neutral-500" />
              <span>{condition.filterType}</span>
            </span>
            <span
              className={`border-r px-2 py-[3px] text-neutral-700 ${
                hasOverlapOnCondition ? "border-red-200" : "border-neutral-300"
              }`}
            >
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
              className={`max-w-[150px] truncate border-r px-2 py-[3px] text-left transition-colors hover:bg-neutral-50/80 ${
                hasOverlapOnCondition
                  ? "border-red-200 text-red-700"
                  : "border-neutral-300 text-neutral-900"
              } ${hasEmptyValue ? "text-neutral-400" : ""}`}
              title={
                hasOverlapOnCondition
                  ? "This value is also selected for another team"
                  : undefined
              }
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
                className="absolute left-0 top-full z-[120] mt-1 w-fit max-w-[160px] max-h-[260px] overflow-y-auto overflow-x-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl"
              >
                {valueOptions.map((value) => {
                  const checked = selectedValues.includes(value);
                  const optionDisabled = disabledValues.has(value) && !checked;
                  const isOverlapping = checked && overlappingValues.has(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={optionDisabled}
                      onClick={() => handleToggleValue(condition, value)}
                      className={`flex max-w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[12px] ${
                        optionDisabled
                          ? "cursor-not-allowed text-neutral-300"
                          : isOverlapping
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "text-neutral-900 hover:bg-neutral-50"
                      }`}
                      title={
                        isOverlapping
                          ? "Also selected for another team — remove from one team"
                          : undefined
                      }
                    >
                      <span
                        className={`flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[4px] border ${
                          checked
                            ? "border-emerald-500 bg-emerald-500"
                            : optionDisabled
                              ? "border-neutral-200 bg-neutral-50"
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
                })}
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
            Add condition
          </button>
          {openConditionMenu?.kind === "field" && openConditionMenu.team === team ? (
            <div
              data-condition-menu=""
              className="absolute left-0 top-full z-[120] mt-1 w-fit max-w-[160px] overflow-x-hidden rounded-xl border border-neutral-200 bg-white p-2 shadow-xl"
            >
              {availableFilterOptions.map((filterType) => {
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AgentScopeTeamCard({
  scope,
  excludedTeams = [],
  showFallbackStatus = false,
  onUpdate,
  onRemove,
}) {
  const [openConditionMenu, setOpenConditionMenu] = useState(null);
  const teams = normalizeSelections(scope.teams ?? scope.team);
  const teamConditions = scope.teamConditions || {};
  const isMultiTeam = teams.length >= 2;

  const dispatchToTeamOptions = useMemo(() => {
    const excluded = new Set(excludedTeams);
    return TEAMS.filter((team) => teams.includes(team) || !excluded.has(team));
  }, [excludedTeams, teams]);

  const handleTeamsChange = (nextTeams) => {
    onUpdate({
      teams: nextTeams,
      teamConditions: syncTeamConditionsWithTeams(nextTeams, teamConditions),
    });
  };

  const handleTeamConditionsChange = (nextTeamConditions) => {
    onUpdate({ teamConditions: nextTeamConditions });
  };

  const hasBoard = Boolean(scope.view);
  const statusOptions = getBoardStatusOptions(scope.view);
  const fallbackStatusOptions = getBoardFallbackStatusOptions(scope.view);

  const handleBoardChange = (view) => {
    const patch = { view };
    if (!view) {
      patch.statuses = [];
      patch.fallbackStatus = "";
      onUpdate(patch);
      return;
    }

    const nextStatusOptions = getBoardStatusOptions(view);
    const nextFallbackOptions = getBoardFallbackStatusOptions(view);
    const currentStatuses = scope.statuses ?? [];
    const validStatuses = currentStatuses.filter((status) => nextStatusOptions.includes(status));
    if (validStatuses.length !== currentStatuses.length) {
      patch.statuses = validStatuses;
    }
    if (scope.fallbackStatus && !nextFallbackOptions.includes(scope.fallbackStatus)) {
      patch.fallbackStatus = "";
    }
    onUpdate(patch);
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
      scope={scope}
      team={team}
      teams={teams}
      conditions={teamConditions[team] || []}
      teamConditions={teamConditions}
      onUpdateTeamConditions={handleTeamConditionsChange}
      openConditionMenu={openConditionMenu}
      setOpenConditionMenu={setOpenConditionMenu}
    />
  );

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-visible">
      <button
        type="button"
        onClick={() => onUpdate({ expanded: !scope.expanded })}
        className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-neutral-50/80 transition-colors"
        aria-expanded={scope.expanded}
      >
        <span className="min-w-0 truncate text-sm">
          <ScopeCardHeaderLabel scope={scope} />
        </span>
        <span className="flex shrink-0 items-center gap-[4px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Remove scope section"
          >
            <Trash2 size={15} />
          </button>
          {scope.expanded ? (
            <ChevronUp size={16} className="text-neutral-400" aria-hidden />
          ) : (
            <ChevronDown size={16} className="text-neutral-400" aria-hidden />
          )}
        </span>
      </button>

      {scope.expanded ? (
        <div className="border-t border-neutral-100">
          <Row
            label="Dispatch to"
            subcopy="Select the Inbox Team threads will be dispatched to."
          >
            <MultiSelect
              values={teams}
              options={dispatchToTeamOptions}
              onChange={handleTeamsChange}
              placeholder="Select Inbox team"
              summaryLabel={
                teams.length === 0
                  ? undefined
                  : teams.length === 1
                    ? teams[0]
                    : `${teams.length} teams selected`
              }
              dropdownClassName="w-[280px]"
            />
          </Row>
          <div className={`px-5 py-4 ${hasBoard ? "border-b border-neutral-100" : ""}`}>
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-neutral-900">Dispatch from</div>
                <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                  Select the board to dispatch threads from. Add conditions to narrow the scope.
                </p>
              </div>
              <Select
                value={scope.view}
                options={SCOPE_BOARD_OPTIONS}
                onChange={handleBoardChange}
                placeholder="Select board"
                dropdownClassName="w-[220px]"
              />
            </div>
            <div className="mt-3 min-w-0">
              {teams.length === 0 ? null : isMultiTeam ? (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div key={team} className="space-y-2">
                      <div className="text-sm font-medium text-neutral-900">{team}:</div>
                      {renderConditionsForTeam(team)}
                    </div>
                  ))}
                  {hasOverlappingTeamConditions(scope) ? <MutualExclusivityNote /> : null}
                </div>
              ) : (
                renderConditionsForTeam(teams[0])
              )}
            </div>
          </div>
          {hasBoard ? (
            <>
              <Row
                label="Status"
                subcopy="Select status(es) the agent should focus on"
                noBorder={!showFallbackStatus}
              >
                <MultiSelect
                  values={scope.statuses ?? []}
                  options={statusOptions}
                  onChange={(statuses) => onUpdate({ statuses })}
                  placeholder="Select status"
                  searchable
                  searchPlaceholder="Search statuses..."
                  dropdownClassName="w-[280px]"
                />
              </Row>
              {showFallbackStatus ? (
                <Row
                  label="Fallback status"
                  subcopy={
                    <>
                      Status set when no one is available.{" "}
                      <a
                        href="#"
                        className="inline-flex items-center gap-0.5 font-medium text-emerald-600 hover:text-emerald-700"
                        onClick={(event) => event.preventDefault()}
                      >
                        Set up a Flow
                        <ArrowUpRight size={12} strokeWidth={2.25} aria-hidden />
                      </a>{" "}
                      to handle this.
                    </>
                  }
                  noBorder
                >
                  <Select
                    value={scope.fallbackStatus ?? ""}
                    options={fallbackStatusOptions}
                    onChange={(fallbackStatus) => onUpdate({ fallbackStatus })}
                    placeholder="Select status"
                    dropdownClassName="w-[220px]"
                  />
                </Row>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
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
    value: 18,
  },
  {
    id: "sla-risk",
    name: "SLA risk",
    description: "Tickets closer to breaching rank higher.",
    enabled: true,
    value: 25,
  },
  {
    id: "ticket-age",
    name: "Ticket age",
    description: "Older tickets rank higher when properties are equal.",
    enabled: true,
    value: 10,
  },
  {
    id: "client-replied",
    name: "Client replied",
    description: "Tickets with unanswered replies rank higher.",
    enabled: true,
    value: 20,
  },
  {
    id: "sentiment",
    name: "Sentiment",
    description: "Tickets with negative client sentiment rank higher.",
    enabled: true,
    value: 12,
  },
  {
    id: "contact-type",
    name: "Contact type",
    description: "Tickets matching any selected type rank higher.",
    enabled: true,
    value: 8,
    options: ["Standard", "VIP", "Executive"],
    selectedOptions: ["Standard"],
    multiSelect: true,
  },
  {
    id: "company-type",
    name: "Company type",
    description: "Tickets matching any selected company type rank higher.",
    enabled: true,
    value: 7,
    options: SCOPE_FILTER_METADATA["Company type"].values,
    selectedOptions: ["Managed Service"],
    multiSelect: true,
  },
  {
    id: "agreement-type",
    name: "Agreement type",
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
    selectedOptions: ["Block Time - One time"],
    multiSelect: true,
  },
];

function clampRankingWeight(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? Math.max(0, Math.min(100, Math.round(next))) : fallback;
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

function RankingPropertyRow({ signal, onSetWeight, onPatchSignal, isFirst, isLast }) {
  const hasOptions = Array.isArray(signal.options) && signal.options.length > 0;

  return (
    <div
      className={`flex items-center gap-4 bg-white px-5 py-4 ${isFirst ? "rounded-t-lg" : ""} ${
        isLast ? "rounded-b-lg" : "border-b border-neutral-200"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-neutral-900">{signal.name}</div>
          {hasOptions ? (
            <>
              <span className="text-sm text-neutral-500">is</span>
              {signal.multiSelect ? (
                <MultiSelect
                  values={signal.selectedOptions ?? []}
                  options={signal.options}
                  onChange={(selectedOptions) =>
                    onPatchSignal(signal.id, { selectedOptions })
                  }
                  placeholder="Select types"
                  triggerClassName="!h-6 !min-h-6 !max-h-6 !py-0 max-w-[180px] px-2 text-xs"
                  menuWidth={signal.id === "agreement-type" ? 300 : undefined}
                  dropdownClassName={
                    signal.id === "agreement-type" ? "min-w-[300px]" : "min-w-[180px]"
                  }
                />
              ) : (
                <Select
                  value={signal.selectedOption}
                  options={signal.options}
                  onChange={(selectedOption) =>
                    onPatchSignal(signal.id, { selectedOption })
                  }
                  triggerClassName="!h-6 !min-h-6 !max-h-6 !py-0 max-w-[180px] px-2 text-xs"
                />
              )}
            </>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-neutral-500">{signal.description}</p>
      </div>

      <div className="w-[200px] shrink-0">
        <div className="mt-1 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Slider
              min={0}
              max={100}
              step={1}
              value={[signal.value]}
              onValueChange={([value]) => onSetWeight(signal.id, value)}
            />
          </div>
          <span className="shrink-0 text-right text-xs tabular-nums text-neutral-500">
            {signal.value}/100
          </span>
        </div>
      </div>
    </div>
  );
}

const GUIDANCE_AGENT_CONTEXT_ITEMS = [
  "Contact name and type",
  "Company name and type",
  "Ticket priority, type, subtype, and item",
  "Thread SLA status and time to breach",
  "Ticket summary and conversation history",
  "Agreement name and type",
  "Ticket configuration",
];

const RANKING_SIGNALS_INFO_TITLE = "How ranking works";
const RANKING_SIGNALS_INFO_PARAGRAPHS = [
  "Set how much each ticket property matters for ranking. Set a property to 0 to exclude it from scoring.",
  "Each ticket earns a score based on how it matches — for example SLA breaching or an unanswered client reply. Higher total score = served first.",
];
const RANKING_SIGNALS_INFO_FOOTNOTE =
  "Scores update when ticket details change. Test a few scenarios in the panel on the right.";

function GuidanceSection({
  guidanceTab,
  onGuidanceTabChange,
  customGuidance,
  onCustomGuidanceChange,
  assignAgentInstructions,
  onAssignAgentInstructionsChange,
  onResetAgentInstructions,
  onUndoLastSaved,
  canUndoLastSaved = false,
}) {
  const guidanceTextareaClassName =
    "w-full resize-y rounded-md border border-neutral-200 px-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed font-['IBM_Plex_Mono',ui-monospace,monospace]";
  const customGuidanceTextareaClassName = `${guidanceTextareaClassName} min-h-[140px]`;
  const agentInstructionsTextareaClassName = `${guidanceTextareaClassName} min-h-[200px]`;

  return (
    <div className="mb-10">
      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold text-neutral-900">Guidance</h2>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex rounded p-0.5 text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                aria-label="What the agent already knows"
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
              <div className="text-sm font-medium text-neutral-900">
                The agent already knows:
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-neutral-500">
                {GUIDANCE_AGENT_CONTEXT_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-0.5 text-sm text-neutral-500">
          Provide additional instructions and context for the dispatch agent when prioritizing
          threads.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="px-5 pt-4">
          <div
            className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5"
            role="tablist"
            aria-label="Guidance mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={guidanceTab === "basic"}
              onClick={() => onGuidanceTabChange("basic")}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                guidanceTab === "basic"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Basic
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={guidanceTab === "advanced"}
              onClick={() => onGuidanceTabChange("advanced")}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1 text-sm font-medium transition-colors ${
                guidanceTab === "advanced"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Code2 size={14} className="text-neutral-500" aria-hidden />
              Advanced
            </button>
          </div>
        </div>

        {guidanceTab === "basic" ? (
          <div className="px-5 pb-4 pt-3" role="tabpanel">
            <div className="text-sm font-medium text-neutral-900">Custom guidance</div>
            <textarea
              value={customGuidance}
              onChange={(event) => onCustomGuidanceChange(event.target.value)}
              placeholder="Enter custom guidance for the dispatch agent (optional)..."
              className={`mt-2 ${customGuidanceTextareaClassName}`}
            />
          </div>
        ) : (
          <div className="px-5 pb-4 pt-3" role="tabpanel">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-neutral-900">Agent instructions</div>
              <div className="flex shrink-0 items-center gap-4">
                <button
                  type="button"
                  onClick={onUndoLastSaved}
                  disabled={!canUndoLastSaved}
                  className={`text-sm font-medium ${
                    canUndoLastSaved
                      ? "text-neutral-700 hover:text-neutral-900"
                      : "cursor-not-allowed text-neutral-400"
                  }`}
                >
                  Undo last saved changes
                </button>
                <button
                  type="button"
                  onClick={onResetAgentInstructions}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Reset to default
                </button>
              </div>
            </div>
            <textarea
              value={assignAgentInstructions}
              onChange={(event) => onAssignAgentInstructionsChange(event.target.value)}
              className={agentInstructionsTextareaClassName}
            />
          </div>
        )}
      </div>
    </div>
  );
}

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
                aria-label={RANKING_SIGNALS_INFO_TITLE}
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
              <div className="text-sm font-medium text-neutral-900">
                {RANKING_SIGNALS_INFO_TITLE}
              </div>
              <div className="mt-2 space-y-2 text-sm text-neutral-500">
                {RANKING_SIGNALS_INFO_PARAGRAPHS.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-3 text-xs text-neutral-400">{RANKING_SIGNALS_INFO_FOOTNOTE}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-0.5 text-sm text-neutral-500">
          Adjust each property&apos;s importance. Set a property to 0 to exclude it from scoring.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {signals.map((signal, index) => (
          <RankingPropertyRow
            key={signal.id}
            signal={signal}
            isFirst={index === 0}
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
        { icon: LayoutGrid, label: "Auto-dispatch" },
        { icon: Wand2, label: "Magic Agents" },
        { icon: Target, label: "Intelligence" },
      ],
    },
    {
      label: "Automation",
      items: [
        { icon: Workflow, label: "Status automation" },
        { icon: CheckSquare, label: "Flows" },
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
        { icon: FileText, label: "SLAs" },
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
    <aside className="flex h-full w-56 shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-[#FAF9F6]">
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

      <nav className="min-h-0 flex-1 overflow-hidden px-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <div className="px-3 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5">
              {g.label}
            </div>
            <div className="space-y-0.5">
              {g.items.map(({ icon: Icon, label }) => {
                const navigable = NAVIGABLE_ITEMS.has(label);
                return (
                  <div
                    key={label}
                    onClick={() => navigable && onSelect?.(label)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm ${
                      active === label
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

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-visible">
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
          <div className="text-xs text-neutral-500 mt-0.5 truncate">{subtitle}</div>
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
        className="flex items-center px-5 py-2.5 border-t border-neutral-100 bg-white rounded-b-xl cursor-pointer outline-none transition-colors hover:bg-[rgba(236,236,237,0.6)] active:bg-[rgba(236,236,237,0.75)] focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
          <div className="text-xs text-neutral-500 mt-0.5">
            Adjust scope and assignment logic for this agent.
          </div>
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
      <header className="shrink-0 border-b border-neutral-200 bg-white px-8 py-4">
        <h1 className="text-lg font-semibold text-neutral-900">Assistive AI</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-12">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-10 h-10 rounded-md bg-emerald-100 flex items-center justify-center mb-4">
            <LayoutGrid size={20} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Auto-dispatch</h2>
          <p className="text-sm text-neutral-500 mt-2 max-w-lg leading-relaxed">
            Automatically assign incoming tickets to the right person on each team.
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
            <div className="border border-dashed border-[#00BB99] rounded-xl bg-transparent py-14 px-6 flex flex-col items-center">
              <div className="text-[14px] font-semibold text-neutral-900">
                Configure your first dispatch agent
              </div>
              <p className="text-sm text-neutral-500 mt-1.5 mb-6 max-w-sm text-center">
                Create an agent to start automatically assigning tickets to your team.
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

  const defaultNewAgentTitle = isRoute ? "New routing agent" : `New ${mode.toLowerCase()} agent`;

  // --- Agent identity
  const [agentDisplayName, setAgentDisplayName] = useState(initialAgent?.name ?? "");
  const [avatarId, setAvatarId] = useState(initialAgent?.avatarId ?? "avatar-1");
  const [dispatchMode, setDispatchMode] = useState(initialAgent?.dispatchMode ?? "Auto-assign");
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
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
  const [active, setActive] = useState(initialAgent?.active ?? true);
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
          view: scope.view ?? scope.board ?? initialViews[index] ?? "",
          fallbackStatus: scope.fallbackStatus ?? initialAgent?.fallbackStatus,
        })
      );
    }
    if (initialTeams.length > 0) {
      return initialTeams.map((team, index) =>
        createTeamScope(index + 1, {
          teams: [team],
          view: initialViews[index] ?? initialViews[0] ?? "",
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
  const [maxActiveThreads, setMaxActiveThreads] = useState(
    initialAgent?.maxActiveThreads ?? "No limit"
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

  const [guidanceTab, setGuidanceTab] = useState("basic");
  const [customGuidance, setCustomGuidance] = useState(initialAgent?.guidance ?? "");
  const initialAssignAgentInstructions =
    initialAgent?.assignAgentInstructions ?? DEFAULT_ASSIGN_AGENT_INSTRUCTIONS;
  const [assignAgentInstructions, setAssignAgentInstructions] = useState(
    initialAssignAgentInstructions
  );
  const [lastSavedAssignAgentInstructions, setLastSavedAssignAgentInstructions] =
    useState(initialAssignAgentInstructions);
  const canUndoAssignAgentInstructions =
    assignAgentInstructions !== lastSavedAssignAgentInstructions;
  const assignModeInstructions = useMemo(() => {
    const parts = [assignAgentInstructions.trim(), customGuidance.trim()].filter(Boolean);
    return parts.join("\n\n");
  }, [assignAgentInstructions, customGuidance]);

  // --- Agent autonomy (Assign + Assign+Schedule)
  const [limitWorkload, setLimitWorkload] = useState(false);
  const [workloadPct, setWorkloadPct] = useState(50);

  // --- Thread scoring (Assign + Assign+Schedule)
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

    // Legacy: FilterBar-style
    if (condition?.filterAttribute) {
      const attr = condition.filterAttribute;
      const matchedField =
        routeFieldOptions.find((f) => f.id === attr.id || f.name === attr.name) || routeFieldOptions[0];
      const ids = (condition.filterValue || []).map((v) => v.id).filter(Boolean);
      return {
        id: condition.id || newConditionId(),
        version: 2,
        fieldId: matchedField.id,
        operator: "is",
        valueIds: ids,
      };
    }

    // Legacy: { field, value }
    const fieldName = condition?.field || "";
    const matchedField =
      routeFieldOptions.find((f) => f.name === fieldName) || routeFieldOptions[0];
    const valueId = condition?.value ? String(condition.value) : null;
    return {
      id: condition?.id || newConditionId(),
      version: 2,
      fieldId: matchedField.id,
      operator: "is",
      valueIds: valueId ? [valueId] : [],
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
  const [keepOnBoardPrompt, setKeepOnBoardPrompt] = useState("");

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
  // With the 1 team = 1 board assumption, team uniqueness covers board uniqueness.
  // Relax this rule when we later support shared boards via company/tsi filters.
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
    () => teamScopes.map((scope) => scope.view).filter(Boolean),
    [teamScopes]
  );
  const excludedTeamsByScopeId = useMemo(() => {
    const excludedByScopeId = {};
    teamScopes.forEach((scope) => {
      excludedByScopeId[scope.id] = teamScopes
        .filter((otherScope) => otherScope.id !== scope.id)
        .flatMap((otherScope) => normalizeSelections(otherScope.teams ?? otherScope.team));
    });
    return excludedByScopeId;
  }, [teamScopes]);

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

  const removeTeamScope = (id) => {
    setTeamScopes((prev) => prev.filter((scope) => scope.id !== id));
  };

  const handleSaveClick = () => {
    const primaryScope = teamScopes[0];
    const publishedAt = new Date();
    setLastPublishedAt(publishedAt);
    setLastSavedAssignAgentInstructions(assignAgentInstructions);
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
      calendarAvailabilityEnabled: isRoute ? undefined : calendarAvailabilityEnabled,
      calendarAvailability: isRoute
        ? undefined
        : calendarAvailabilityEnabled
          ? "Today and tomorrow"
          : "Ignore",
      excludeTechs: [],
      excludeTechsEnabled: false,
      skipFlowAssignedTickets: primaryScope?.skipFlowAssignedTickets ?? false,
      fallbackStatus:
        isRoute || dispatchMode !== "Auto-assign"
          ? "No change"
          : primaryScope?.fallbackStatus ?? "Escalation",
      destinations: isRoute ? rules.map((r) => r.board).filter(Boolean) : [],
      routeRules: isRoute ? rules : undefined,
      guidance: isRoute ? undefined : customGuidance,
      assignAgentInstructions: isRoute ? undefined : assignAgentInstructions,
      agentInstructions: isRoute
        ? undefined
        : dispatchMode === "Auto-assign"
          ? assignModeInstructions
          : agentInstructions,
      rankingSignals: isRoute ? undefined : rankingSignals,
      statuses: isRoute ? statuses : primaryScope?.statuses ?? [],
      statusMode: isRoute ? statusMode : "Include only",
      active,
      lastPublishedAt: publishedAt.toISOString(),
    });
  };

  const headerTitle =
    agentDisplayName.trim() ||
    (initialAgent?.name ?? defaultNewAgentTitle);

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#FAF9F6]">
      <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onBack}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="truncate text-base font-semibold text-neutral-900">
            {headerTitle}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setTestPanelOpen((open) => !open)}
            aria-expanded={testPanelOpen}
            className={`inline-flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-sm font-medium transition-colors ${
              testPanelOpen
                ? "border-neutral-300 bg-neutral-100 text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            <Play size={14} className="text-neutral-500" aria-hidden />
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
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
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
                  <Sparkles size={18} className="shrink-0 text-neutral-400" strokeWidth={1.75} />
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
                  onClick={() => setDispatchMode("Self-serve")}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition-colors ${
                    dispatchMode === "Self-serve"
                      ? "border-teal-500"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <ListOrdered size={18} className="shrink-0 text-neutral-400" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-neutral-900">Self-serve</div>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      Techs request threads when ready
                    </p>
                  </div>
                  {dispatchMode === "Self-serve" ? (
                    <Check size={16} className="shrink-0 text-teal-600" strokeWidth={2.5} />
                  ) : null}
                </button>
              </div>
            </div>
          </div>
        )}

        <Section title="Agent identity">
          <Row
            label="Name your agent"
            subcopy="How your team identifies this agent"
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
            label="Agent's avatar"
            subcopy="To help set your agents apart"
            noBorder
          >
            <div className="relative" ref={avatarPickerWrapRef}>
              <button
                type="button"
                onClick={() => setAvatarPickerOpen((o) => !o)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white p-0.5 transition-colors hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                aria-expanded={avatarPickerOpen}
                aria-haspopup="listbox"
                aria-label="Choose agent avatar"
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
                {dispatchMode === "Self-serve" ? "Scope" : "Agent scope"}
              </h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                {dispatchMode === "Self-serve"
                  ? "Use multiple sections when teams share the same ranking logic."
                  : "Use multiple sections when teams share the same dispatch logic."}
              </p>
            </div>
            <div className="space-y-3">
              {teamScopes.map((scope) => (
                <AgentScopeTeamCard
                  key={scope.id}
                  scope={scope}
                  excludedTeams={excludedTeamsByScopeId[scope.id] ?? []}
                  showFallbackStatus={dispatchMode === "Auto-assign"}
                  onUpdate={(patch) => updateTeamScope(scope.id, patch)}
                  onRemove={() => removeTeamScope(scope.id)}
                />
              ))}
            </div>
            {teamScopes[0] ? (
              <div className="mt-3 rounded-lg border border-neutral-200 bg-white">
                <Row
                  label="Skip tickets assigned by Flows"
                  subcopy="When enabled, auto dispatch will skip tickets that are already being assigned by a Flow."
                  noBorder
                  align="center"
                >
                  <div className="inline-flex shrink-0 items-center">
                    <Switch
                      size="sm"
                      checked={teamScopes[0].skipFlowAssignedTickets}
                      onCheckedChange={(skipFlowAssignedTickets) =>
                        updateTeamScope(teamScopes[0].id, { skipFlowAssignedTickets })
                      }
                    />
                  </div>
                </Row>
              </div>
            ) : null}
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
                    className={`bg-white border rounded-lg ${
                      error ? "border-red-300" : "border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-white rounded-t-lg">
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
                    {/* When... + filter conditions — temporarily hidden, may be reintroduced later
                    <div className="px-4 pt-3 pb-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="text-sm text-neutral-800">When...</span>
                        <RouteRuleConditionsEditor
                          fields={routeFieldOptions}
                          conditions={rule.conditions || []}
                          onChange={(nextConditions) =>
                            updateRule(rule.id, { conditions: nextConditions })
                          }
                        />
                      </div>
                    </div>
                    */}
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
              subcopy="Define how the agent selects the right technician for each thread."
            >
              <Row
                label="Max active threads"
                subcopy="Maximum active tickets before the agent skips this tech."
              >
                <Select
                  value={maxActiveThreads}
                  options={["No limit", "5", "10", "15", "20"]}
                  onChange={setMaxActiveThreads}
                />
              </Row>
              <Row
                label="Calendar availability"
                subcopy={
                  <>
                    Check Planner for open time before assigning a tech.{" "}
                    <a
                      href="#"
                      className="inline-flex items-center gap-0.5 text-[#00BB99] hover:text-[#00967A]"
                      onClick={(event) => event.preventDefault()}
                    >
                      Connect to Outlook
                      <ArrowUpRight className="size-3.5 shrink-0" strokeWidth={2.25} />
                    </a>
                  </>
                }
                align="center"
                noBorder
              >
                <div className="inline-flex shrink-0 items-center">
                  <Switch
                    size="sm"
                    checked={calendarAvailabilityEnabled}
                    onCheckedChange={setCalendarAvailabilityEnabled}
                  />
                </div>
              </Row>
            </Section>
            {/* Guidance — hidden for prototype; set to true to show */}
            {false && (
              <GuidanceSection
                guidanceTab={guidanceTab}
                onGuidanceTabChange={setGuidanceTab}
                customGuidance={customGuidance}
                onCustomGuidanceChange={setCustomGuidance}
                assignAgentInstructions={assignAgentInstructions}
                onAssignAgentInstructionsChange={setAssignAgentInstructions}
                onResetAgentInstructions={() =>
                  setAssignAgentInstructions(DEFAULT_ASSIGN_AGENT_INSTRUCTIONS)
                }
                canUndoLastSaved={canUndoAssignAgentInstructions}
                onUndoLastSaved={() =>
                  setAssignAgentInstructions(lastSavedAssignAgentInstructions)
                }
              />
            )}
          </>
        )}

        {/* Thread scoring — Self-serve only */}
        {!isRoute && dispatchMode === "Self-serve" && (
          <RankingSignalsSection signals={rankingSignals} onChangeSignals={setRankingSignals} />
        )}

        {/* Auto-assign limit — hidden for prototype; set to true to show */}
        {false && (
          <Section
            title="Auto-assign limit"
            subcopy="When enabled, you can set assignment limits for threads."
          >
              <Row
                label="Limit auto-assignment"
                subcopy="When this is off, all threads in the status(es) you specified will be automatically assigned."
                noBorder={!limitWorkload}
                align="center"
              >
                <Switch
                  checked={limitWorkload}
                  onCheckedChange={setLimitWorkload}
                  size="sm"
                />
              </Row>
              {limitWorkload && (
                <Row
                  label="Percentage of tickets handled"
                  subcopy="The agent will automatically dispatch this percentage of new tickets."
                  noBorder
                >
                  <div className="flex items-center gap-3">
                    <Slider
                      min={10}
                      max={100}
                      step={1}
                      value={[workloadPct]}
                      onValueChange={([v]) => setWorkloadPct(v)}
                      className="w-48"
                    />
                    <span className="text-sm text-neutral-700 tabular-nums min-w-[3ch] text-right">
                      {workloadPct}%
                    </span>
                  </div>
                </Row>
              )}
          </Section>
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
                {formatLastPublished(lastPublishedAt)}
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
                  dispatchMode === "Auto-assign" ? assignModeInstructions : agentInstructions
                }
                rankingSignals={rankingSignals}
                outputMode={
                  dispatchMode === "Auto-assign" ? "recommendation" : "points"
                }
                maxActiveThreads={maxActiveThreads}
                calendarAvailabilityEnabled={calendarAvailabilityEnabled}
                fallbackStatus={teamScopes[0]?.fallbackStatus || "Escalation"}
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
