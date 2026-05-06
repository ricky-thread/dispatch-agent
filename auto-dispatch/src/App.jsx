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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FlowsPage from "./components/flows/FlowsPage";
import {
  ArrowLeft,
  Activity,
  Briefcase,
  Building2,
  Check,
  CheckSquare,
  ChevronDown,
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
  MoreHorizontal,
  Package,
  Pencil,
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
  Users,
  Wallet,
  Wand2,
  Workflow,
  X,
  Zap,
} from "lucide-react";

import {
  BOARDS,
  TEAMS,
  STATUSES,
  HOUR_OPTIONS,
  ROUTE_CONDITION_FIELDS,
  ROUTE_CONDITION_VALUES,
} from "./constants";

const TEAM_MEMBERS = {
  "Team Red": ["Avery Reed", "Mina Patel", "Noah Brooks", "Jules Hart"],
  "Team Blue": ["Leah Kim", "Owen Price", "Rosa Diaz", "Eli Turner"],
  "Team Green": ["Maya Singh", "Luca Romano", "Ivy Chen", "Max Foster"],
  "Network Ops": ["Nina Walsh", "Caleb Young", "Priya Shah", "Jon Park"],
  Procurement: ["Sam Rivera", "Tara Wells", "Gabe King", "Mia Scott"],
};

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
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);
  const isEmpty = !value;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = searchable
    ? options.filter((opt) => opt.toLowerCase().includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (!open) return undefined;
    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open || !searchable) return;
    searchInputRef.current?.focus();
  }, [open, searchable]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 max-w-[220px] px-3 py-1.5 bg-white border border-neutral-200 rounded-md text-sm hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${triggerClassName}`}
      >
        <span className={`truncate ${isEmpty ? "text-neutral-400" : "text-neutral-800"}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className="text-neutral-400 shrink-0" />
      </button>
      {open && (
        <div
          className={`absolute right-0 top-full mt-1 min-w-full bg-white border border-neutral-200 rounded-md shadow-lg py-1 z-20 max-h-64 overflow-y-auto ${dropdownClassName}`}
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
            filteredOptions.map((opt) => (
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
            ))
          )}
        </div>
      )}
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
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = searchable
    ? options.filter((opt) => opt.toLowerCase().includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (!open) return undefined;
    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
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

  return (
    <div ref={rootRef} className="relative">
      <button
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
      {open && !disabled && (
        <div
          className={`absolute right-0 top-full mt-1 min-w-full bg-white border border-neutral-200 rounded-md shadow-lg z-20 flex flex-col ${dropdownClassName}`}
          style={{ maxHeight: "min(34rem, calc(100vh - 6rem))" }}
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
      )}
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

function Toggle({ checked, onChange, size = "default" }) {
  return (
    <Switch checked={checked} onCheckedChange={onChange} size={size} />
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
const NAVIGABLE_ITEMS = new Set(["Auto-dispatch", "Flows"]);

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
    <aside className="w-56 shrink-0 bg-[#FAF9F6] border-r border-neutral-200 flex flex-col">
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
          <Toggle
            checked={agent.active}
            onChange={() => onToggleActive(agent.id)}
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
    <main className="flex-1 bg-[#FAF9F6] min-h-screen">
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
            <div className="border-2 border-dashed border-emerald-200 rounded-xl bg-white py-14 px-6 flex flex-col items-center">
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
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const avatarPickerWrapRef = useRef(null);

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
  const [teams, setTeams] = useState(
    normalizeSelections(initialAgent?.teams ?? initialAgent?.team)
  );
  const [boards, setBoards] = useState(
    normalizeSelections(initialAgent?.boards ?? initialAgent?.board)
  );
  const [statusMode, setStatusMode] = useState("Include only");
  const [statuses, setStatuses] = useState(initialAgent?.statuses ?? []);
  const [excludeTechs, setExcludeTechs] = useState(initialAgent?.excludeTechs ?? []);
  const [excludeTechsEnabled, setExcludeTechsEnabled] = useState(
    initialAgent?.excludeTechsEnabled ??
      Boolean((initialAgent?.excludeTechs ?? []).length > 0)
  );
  const [skipFlowAssignedTickets, setSkipFlowAssignedTickets] = useState(
    initialAgent?.skipFlowAssignedTickets ?? false
  );

  // --- Working hours (Assign + Schedule)
  const [startTime, setStartTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("5:00 PM");
  const [offset, setOffset] = useState("Every 30 min");
  const [scheduleInterval, setScheduleInterval] = useState("Every 15 min");
  const [scheduleWindow, setScheduleWindow] = useState("Today only");
  const [slotSelection, setSlotSelection] = useState("Earliest available");
  const [duration, setDuration] = useState("30 min");

  // --- Assignment logic (Assign + Assign+Schedule)
  const [assignMode] = useState(initialAgent?.assignMode ?? "Push");
  const [priority, setPriority] = useState("Highest first");
  const [techSelection, setTechSelection] = useState("Least active threads assigned");
  const [maxAssignedThreads, setMaxAssignedThreads] = useState("No limit");
  const [fallbackStatus, setFallbackStatus] = useState(
    STATUSES.find((s) => s.toUpperCase() === "NEW") || STATUSES[0]
  );

  const MAX_ASSIGNED_THREADS_OPTIONS = [
    "No limit",
    "5",
    "10",
    "15",
    "20",
    "25",
    "30",
    "35",
    "40",
    "45",
    "50",
  ];

  // --- Agent autonomy (Assign + Assign+Schedule)
  const [limitWorkload, setLimitWorkload] = useState(false);
  const [workloadPct, setWorkloadPct] = useState(50);

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

  const claimedTeams = new Map();
  const claimedBoards = new Map();
  assignmentAgents.forEach((a) => {
    normalizeSelections(a.teams ?? a.team).forEach((t) =>
      claimedTeams.set(t, a.name || "another agent")
    );
    normalizeSelections(a.boards ?? a.board).forEach((b) =>
      claimedBoards.set(b, a.name || "another agent")
    );
  });

  const teamClaimedByAgent = Object.fromEntries(claimedTeams);
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

  const hasErrors = Object.keys(ruleErrors).length > 0;
  const missingRequired =
    boards.length === 0 || (!isRoute && teams.length === 0) || !agentDisplayName.trim();
  const canSave = !hasErrors && !missingRequired;

  const availableMembers = useMemo(() => {
    const members = teams.flatMap((teamName) => TEAM_MEMBERS[teamName] || []);
    return [...new Set(members)];
  }, [teams]);

  useEffect(() => {
    setExcludeTechs((prev) => prev.filter((name) => availableMembers.includes(name)));
  }, [availableMembers]);

  const handleSaveClick = () => {
    onSave({
      name: agentDisplayName.trim(),
      avatarId,
      mode,
      board: boards[0] || "",
      boards,
      team: isRoute ? null : teams[0] || null,
      teams: isRoute ? [] : teams,
      assignMode,
      excludeTechs: excludeTechsEnabled ? excludeTechs : [],
      excludeTechsEnabled,
      skipFlowAssignedTickets,
      destinations: isRoute ? rules.map((r) => r.board).filter(Boolean) : [],
      routeRules: isRoute ? rules : undefined,
      statuses,
      active,
    });
  };

  const headerTitle =
    agentDisplayName.trim() ||
    (initialAgent?.name ?? defaultNewAgentTitle);

  return (
    <main className="flex-1 bg-[#FAF9F6] min-h-screen">
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

        <Section title="Agent identity">
          <Row
            label="Name your agent"
            subcopy="You can always change this in settings later"
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
        <Section
          title="Agent scope"
          subcopy={
            isRoute
              ? "Set the intake board this agent monitors."
              : "Set the team and board this agent monitors."
          }
        >
          {!isRoute && (
            <Row label="Team" subcopy="Select the team tickets will be dispatched to.">
              <MultiSelect
                values={teams}
                options={TEAMS}
                onChange={setTeams}
                placeholder="Select teams"
                searchable
                searchPlaceholder="Search teams..."
                dropdownClassName="w-[320px]"
                disabledClaims={teamClaimedByAgent}
              />
            </Row>
          )}
          {!isRoute && (
            <div className="border-b border-neutral-100">
              <div className="flex items-center justify-between gap-6 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-neutral-900">
                    Exclude techs
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                    Selected members won&apos;t receive tickets from this agent.
                  </p>
                </div>
                <div className="shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                  <Toggle
                    checked={excludeTechsEnabled}
                    onChange={setExcludeTechsEnabled}
                    size="sm"
                  />
                </div>
              </div>
              {excludeTechsEnabled ? (
                <div className="px-5 pb-4">
                  <ExcludeTechsCombo
                    values={excludeTechs}
                    onChange={setExcludeTechs}
                    options={availableMembers}
                    disabled={teams.length === 0}
                    disabledMessage="Select teams first"
                  />
                </div>
              ) : null}
            </div>
          )}
          <Row
            label="Dispatch from"
            subcopy={
              isRoute
                ? "Select the intake board to route tickets from."
                : "Select the board to dispatch tickets from."
            }
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
                withSelectAll
              />
            </div>
          </Row>
          {!isRoute && (
            <Row
              label="Skip tickets assigned by Flows"
              subcopy="When enabled, the agent will skip tickets that are already handled by a Flow with an assign action."
              noBorder
              align="center"
            >
              <Toggle
                checked={skipFlowAssignedTickets}
                onChange={setSkipFlowAssignedTickets}
                size="sm"
              />
            </Row>
          )}
        </Section>

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
            {assignMode === "Push" && (
              <Row
                label="Tech selection"
                subcopy="How the agent determines which technician to assign work to."
              >
                <Select
                  value={techSelection}
                  options={["Least active threads assigned", "Round robin"]}
                  onChange={setTechSelection}
                />
              </Row>
            )}
            <Row label="Priority" subcopy="Assign tickets in order of priority.">
              <Select
                value={priority}
                options={["Highest first", "Lowest first"]}
                onChange={setPriority}
              />
            </Row>
            <Row
              label="Max assigned threads"
              subcopy="Set a maximum number of active threads a tech can have."
            >
              <Select
                value={maxAssignedThreads}
                options={MAX_ASSIGNED_THREADS_OPTIONS}
                onChange={setMaxAssignedThreads}
              />
            </Row>
            <Row
              label="Fallback status"
              subcopy="The status set if no tech is available."
            >
              <Select
                value={fallbackStatus}
                options={STATUSES}
                onChange={setFallbackStatus}
                searchable
                searchPlaceholder="Search statuses..."
                dropdownClassName="w-[280px]"
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
              <ComingSoon />
            </Row>
            <Row
              label="Client familiarity"
              subcopy="Favor technicians who have worked with this client before."
              noBorder
            >
              <ComingSoon />
            </Row>
          </Section>
        )}

        {/* Auto-assign limit — all modes */}
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
              <Toggle checked={limitWorkload} onChange={setLimitWorkload} size="sm" />
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

/** New agents from "Create agent" open in config without a mode picker. */
const DEFAULT_NEW_AGENT_MODE = "Assign";

export default function App() {
  const [section, setSection] = useState("Auto-dispatch"); // "Auto-dispatch" | "Flows"
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

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="min-h-screen flex font-sans text-neutral-900 bg-[#FAF9F6]"
        style={{
          fontFamily:
            "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <Sidebar active={section} onSelect={setSection} />

      {section === "Auto-dispatch" && (
        <>
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

        </>
      )}

        {section === "Flows" && (
          <FlowsPage onBack={() => setSection("Auto-dispatch")} />
        )}
      </div>
    </TooltipProvider>
  );
}
