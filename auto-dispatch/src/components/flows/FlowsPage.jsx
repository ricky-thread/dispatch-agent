import { useEffect, useRef, useState } from "react";
import { STATUSES } from "../../constants.js";
import FlowsMultiSelect from "./FlowsMultiSelect.jsx";
import SuperAgentPanel from "./SuperAgentPanel.jsx";
import "./Flows.css";

// -----------------------------------------------------------------------------
// Inline SVGs preserved 1:1 from the reference prototype so the visuals match.
// Lucide icons would be close, but not identical, so we keep the originals.
// -----------------------------------------------------------------------------
const ICON_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const IconArrowLeft = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...ICON_PROPS}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconChevLeft = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...ICON_PROPS}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...ICON_PROPS}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconInfo = ({ size = 14 }) => (
  <svg
    className="info-icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...ICON_PROPS}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconTrash = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...ICON_PROPS}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconCheck = ({ size = 16 }) => (
  <svg
    className="check"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconLink = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...ICON_PROPS}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconBolt = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconSparkle = ({ size = 14 }) => (
  <svg
    className="tab-icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...ICON_PROPS}
  >
    <path d="M12 3 L13.2 8.8 L19 10 L13.2 11.2 L12 17 L10.8 11.2 L5 10 L10.8 8.8 Z" />
    <path d="M19 17 L19.6 19.4 L22 20 L19.6 20.6 L19 23 L18.4 20.6 L16 20 L18.4 19.4 Z" />
  </svg>
);

const IconGrid = ({ size = 14 }) => (
  <svg
    className="tab-icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...ICON_PROPS}
  >
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const ArrowDown = () => (
  <div className="arrow-down">
    <svg width="24" height="40" viewBox="0 0 24 40" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <line x1="12" y1="0" x2="12" y2="32" />
      <polyline
        points="6 26 12 32 18 26"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  </div>
);

const SlackIcon = () => (
  <svg className="slack-icon" viewBox="0 0 124 124" xmlns="http://www.w3.org/2000/svg">
    <path d="M26.4 78.5c0 7.2-5.9 13.1-13.1 13.1S.2 85.7.2 78.5s5.9-13.1 13.1-13.1h13.1zM33 78.5c0-7.2 5.9-13.1 13.1-13.1s13.1 5.9 13.1 13.1v32.8c0 7.2-5.9 13.1-13.1 13.1s-13.1-5.9-13.1-13.1z" fill="#E01E5A" />
    <path d="M46.1 26c-7.2 0-13.1-5.9-13.1-13.1S38.9-.2 46.1-.2 59.2 5.7 59.2 12.9V26zm0 6.6c7.2 0 13.1 5.9 13.1 13.1s-5.9 13.1-13.1 13.1H13.3C6.1 58.8.2 52.9.2 45.7s5.9-13.1 13.1-13.1z" fill="#36C5F0" />
    <path d="M98.6 45.7c0-7.2 5.9-13.1 13.1-13.1s13.1 5.9 13.1 13.1-5.9 13.1-13.1 13.1H98.6zM92 45.7c0 7.2-5.9 13.1-13.1 13.1s-13.1-5.9-13.1-13.1V12.9c0-7.2 5.9-13.1 13.1-13.1S92 5.7 92 12.9z" fill="#2EB67D" />
    <path d="M78.9 98.2c7.2 0 13.1 5.9 13.1 13.1s-5.9 13.1-13.1 13.1-13.1-5.9-13.1-13.1V98.2zm0-6.6c-7.2 0-13.1-5.9-13.1-13.1s5.9-13.1 13.1-13.1h32.8c7.2 0 13.1 5.9 13.1 13.1s-5.9 13.1-13.1 13.1z" fill="#ECB22E" />
  </svg>
);

// Single source of truth for the example chips that pre-fill the AI prompt.
// The first chip seeds the canonical "AI routing" demo path.
const AI_EXAMPLE_PROMPTS = [
  "Auto-route incoming Triage tickets to the right board",
  "Route VIP tickets to #vip-support and auto-prioritize them",
  "When a ticket is unassigned for over an hour, ping the team lead",
];

const ACTION_TABS = ["Reply", "Note", "Priority", "Assign", "Status", "Actions"];

// Rows under the "Actions" tab inside the Action card. "Auto-route" is the
// new entry that, when selected, opens the Super Magic side panel.
const ACTION_ROWS = [
  "Auto-route",
  "Auto Prioritize",
  "Auto Categorize",
  "Generate Title",
  "Generate Recap Template",
];

// -----------------------------------------------------------------------------
// Reusable card stack — used for both the Classic editor and the AI result.
// In the prototype these are static; switching to real data is straightforward
// because each card is a self-contained presentational component.
// -----------------------------------------------------------------------------
// Filter rows shown inside the "Apply filters" card. The classic editor starts
// with a single board filter; the AI-generated result demonstrates the OR-stacked
// multi-row layout from the reference screenshots.
const CLASSIC_FILTER_ROWS = [
  { field: "Board", operator: "=", value: "Professional Services" },
];

// AI defaults model the canonical "Auto-route Triage tickets" demo flow.
const AI_FILTER_ROWS = [
  { field: "Board", operator: "=", value: "Triage" },
];

/** Lands in the AI hero as the user bubble + seeds the pre-built Triage flow. */
const QUICK_AUTO_ROUTE_PROMPT =
  "Automatically route new tickets to the right boards";

/** Trigger + filter shape for the one-click "Auto-route" starter. */
const QUICK_AUTO_ROUTE_OVERRIDES = {
  triggerStatuses: ["NEW"],
  filterRows: [
    { field: "Board", operator: "=", value: "Triage" },
  ],
};

// Defaults applied when the user clicks "+Rule" to add a new condition.
const NEW_FILTER_ROW = { field: "Board", operator: "=", value: "Help Desk" };

function FlowStack({ ai = false, selectedAction, onSelectAction, flowOverrides = null }) {
  const [activeActionTab, setActiveActionTab] = useState("Actions");
  const [filterRows, setFilterRows] = useState(() =>
    flowOverrides?.filterRows ?? (ai ? AI_FILTER_ROWS : CLASSIC_FILTER_ROWS)
  );
  // Single connector for the whole filter group — changing one OR/AND select
  // updates them all, matching the spec.
  const [connector, setConnector] = useState("OR");
  // Trigger card state: which ticket statuses fire this flow.
  const [triggerStatuses, setTriggerStatuses] = useState(() =>
    flowOverrides?.triggerStatuses ?? (ai ? ["NEW", "IN TRIAGE"] : [])
  );
  const [triggerOperator, setTriggerOperator] = useState("=");

  // Selected action row. When the parent passes `selectedAction` we treat the
  // component as controlled so it can react (e.g. open the Super Magic panel).
  const [internalAction, setInternalAction] = useState(
    ai ? "Auto-route" : "Auto Prioritize"
  );
  const action = selectedAction ?? internalAction;
  const setAction = (next) => {
    if (onSelectAction) onSelectAction(next);
    else setInternalAction(next);
  };

  const addFilterRow = () =>
    setFilterRows((rows) => [...rows, { ...NEW_FILTER_ROW }]);
  const removeFilterRow = (idx) =>
    setFilterRows((rows) => rows.filter((_, i) => i !== idx));

  return (
    <div className="flow-stack">
      <p className="stage-label">When a...</p>
      <div className="card">
        <div className="trigger-grid">
          {/* Field column is hardcoded for now; once we have more trigger
              fields wired up this becomes a real select. */}
          <select className="select" defaultValue="Ticket status">
            <option>Ticket status</option>
          </select>
          <select
            className="select"
            value={triggerOperator}
            onChange={(e) => setTriggerOperator(e.target.value)}
          >
            <option value="=">=</option>
            <option value="≠">{"≠"}</option>
          </select>
          <FlowsMultiSelect
            values={triggerStatuses}
            options={STATUSES}
            onChange={setTriggerStatuses}
            placeholder="Select statuses"
          />
        </div>
      </div>

      <ArrowDown />

      <p className="stage-label">Apply filters</p>
      <div className="card">
        <div className="filter-row">
          <span className="label">
            Time zone
            <IconInfo />
          </span>
          <select className="select" defaultValue="">
            <option value="" disabled>
              Search...
            </option>
          </select>
        </div>
        {filterRows.map((row, idx) => (
          <div key={idx} className="where-grid">
            {idx === 0 ? (
              <span className="connector">Where</span>
            ) : (
              <select
                className="connector-select"
                value={connector}
                onChange={(e) => setConnector(e.target.value)}
                aria-label="Logical operator"
              >
                <option value="OR">OR</option>
                <option value="AND">AND</option>
              </select>
            )}
            <select className="select" defaultValue={row.field}>
              <option>{row.field}</option>
            </select>
            <select className="select" defaultValue={row.operator}>
              <option>=</option>
              <option>{"≠"}</option>
            </select>
            <select className="select" defaultValue={row.value}>
              <option>{row.value}</option>
            </select>
            <button
              className="x-btn"
              aria-label="Remove rule"
              type="button"
              onClick={() => removeFilterRow(idx)}
            >
              ×
            </button>
          </div>
        ))}
        <div className="filter-actions">
          <button className="pill-btn" type="button" onClick={addFilterRow}>
            +Rule
          </button>
          <button className="pill-btn" type="button">
            +Group
          </button>
        </div>
      </div>

      <ArrowDown />

      <p className="stage-label">Channel</p>
      <div className="card">
        <button className="card-trash" aria-label="Remove" type="button">
          <IconTrash />
        </button>
        <div className="channel-row">
          <SlackIcon />
          <div>
            <select className="select" defaultValue={ai ? "#vip-support" : ""}>
              {!ai && (
                <option value="" disabled>
                  Start typing channel name
                </option>
              )}
              <option>#vip-support</option>
              <option>#prof-services</option>
            </select>
            {!ai && (
              <label className="checkbox-row">
                <input type="checkbox" />
                <span>Create a new channel for each ticket</span>
                <span className="help-icon">?</span>
              </label>
            )}
            <label className="checkbox-row">
              <input type="checkbox" defaultChecked={ai} />
              <span>Send note as a message in channel ticket</span>
              <span className="help-icon">?</span>
            </label>
          </div>
        </div>
      </div>

      <ArrowDown />

      <p className="stage-label">
        Action
        <IconInfo />
      </p>
      <div className="card">
        <button className="card-trash" aria-label="Remove" type="button">
          <IconTrash />
        </button>
        <div className="action-tabs">
          {ACTION_TABS.map((label) => {
            const isActive = activeActionTab === label;
            return (
              <button
                key={label}
                type="button"
                className={`action-tab${isActive ? " active" : ""}`}
                onClick={() => setActiveActionTab(label)}
              >
                {label === "Actions" && <IconLink />}
                {label}
              </button>
            );
          })}
        </div>
        <div className="breadcrumb">
          <button className="back" aria-label="Back" type="button">
            <IconChevLeft />
          </button>
          Magic / <span className="breadcrumb-current">{action}</span>
        </div>
        {ACTION_ROWS.map((label) => {
          const isSelected = action === label;
          const isLast = label === "Generate Recap Template";
          return (
            <button
              key={label}
              type="button"
              className="action-row"
              onClick={() => setAction(label)}
              aria-pressed={isSelected}
            >
              <span>{label}</span>
              {isSelected ? (
                <IconCheck />
              ) : isLast ? (
                <span className="chev">
                  <IconChevRight />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
export default function FlowsPage({ onBack }) {
  const [flowOn, setFlowOn] = useState(true);
  const [activeTab, setActiveTab] = useState("classic");
  const [aiState, setAiState] = useState("form"); // "form" | "generating" | "result"
  const [aiPromptText, setAiPromptText] = useState("");
  const [aiResultPrompt, setAiResultPrompt] = useState("");
  // Bumped on every successful generate so the Super Magic panel can be
  // remounted with a fresh conversation, even when the prompt is unchanged.
  const [aiGenerationId, setAiGenerationId] = useState(0);
  /** "prompt" = built from the textarea; "quick" = one-click auto-route starter. */
  const [aiBuildKind, setAiBuildKind] = useState("prompt");
  // Lift the selected action up so the page can decide when to open the
  // Super Magic panel (which only makes sense for "Auto-route").
  const [aiAction, setAiAction] = useState("Auto-route");
  const [saveLabel, setSaveLabel] = useState("Save");
  const [aiSaveLabel, setAiSaveLabel] = useState("Save flow");

  const generateTimer = useRef(null);
  const saveTimer = useRef(null);
  const aiSaveTimer = useRef(null);

  // The Save button in the topbar is enabled once the AI flow has produced a
  // result — matches the reference's `saveBtn.classList.add('enabled')`.
  const saveEnabled = aiState === "result";

  useEffect(
    () => () => {
      clearTimeout(generateTimer.current);
      clearTimeout(saveTimer.current);
      clearTimeout(aiSaveTimer.current);
    },
    []
  );

  const generate = () => {
    const text = aiPromptText.trim();
    if (!text) return;
    setAiBuildKind(text === QUICK_AUTO_ROUTE_PROMPT ? "quick" : "prompt");
    setAiState("generating");
    clearTimeout(generateTimer.current);
    generateTimer.current = setTimeout(() => {
      setAiResultPrompt(text);
      // Every generated flow lands on Auto-route so the user can immediately
      // continue the conversation with the Super Magic panel.
      setAiAction("Auto-route");
      setAiGenerationId((n) => n + 1);
      setAiState("result");
    }, 1500);
  };

  /** One-click path: NEW only, Board = Triage, Auto-route + Super Magic. */
  const applyQuickAutoRoute = () => {
    setAiPromptText(QUICK_AUTO_ROUTE_PROMPT);
    setAiBuildKind("quick");
    setAiState("generating");
    clearTimeout(generateTimer.current);
    generateTimer.current = setTimeout(() => {
      setAiResultPrompt(QUICK_AUTO_ROUTE_PROMPT);
      setAiAction("Auto-route");
      setAiGenerationId((n) => n + 1);
      setAiState("result");
    }, 1500);
  };

  const handlePromptKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      generate();
    }
  };

  const handleTopbarSave = () => {
    if (!saveEnabled) return;
    setSaveLabel("Saved ✓");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveLabel("Save"), 1200);
  };

  const handleAiSave = () => {
    setAiSaveLabel("Saved ✓");
    clearTimeout(aiSaveTimer.current);
    aiSaveTimer.current = setTimeout(() => setAiSaveLabel("Save flow"), 1500);
  };

  return (
    <div className="flows-page">
      {/* ---------------- Topbar ---------------- */}
      <div className="topbar">
        <div className="topbar-row">
          <button
            className="back-btn"
            aria-label="Back"
            type="button"
            onClick={onBack}
          >
            <IconArrowLeft />
          </button>
          <h1 className="flow-title">Test flow</h1>
          <div className="topbar-spacer" />
          <button
            type="button"
            className={`toggle${flowOn ? "" : " off"}`}
            aria-label="Flow on/off"
            aria-pressed={flowOn}
            onClick={() => setFlowOn((v) => !v)}
          >
            {flowOn ? "ON " : "OFF "}
            <span className="knob" />
          </button>
          <button
            type="button"
            className={`save-btn${saveEnabled ? " enabled" : ""}`}
            onClick={handleTopbarSave}
          >
            {saveLabel}
          </button>
        </div>
      </div>

      {/* ---------------- Canvas ---------------- */}
      <div
        className={`canvas${
          activeTab === "ai" &&
          aiState === "result" &&
          aiAction === "Auto-route"
            ? " canvas--result-split"
            : ""
        }`}
      >
        <div className="tabs-wrap">
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "classic"}
              className={`tab${activeTab === "classic" ? " active" : ""}`}
              onClick={() => setActiveTab("classic")}
            >
              <IconGrid />
              Classic flow
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ai"}
              className={`tab${activeTab === "ai" ? " active" : ""}`}
              onClick={() => setActiveTab("ai")}
            >
              <IconSparkle />
              AI flows <span className="badge">NEW</span>
            </button>
          </div>
        </div>

        {activeTab === "classic" && <FlowStack />}

        {activeTab === "ai" && (
          <>
            {aiState === "form" && (
              <div className="ai-hero">
                <h2>Describe the flow you want to build</h2>
                <p className="sub">
                  Tell us in plain English what should happen when a ticket comes in. We&apos;ll
                  build the flow for you — you can tweak it after.
                </p>
                <div className="ai-form">
                  <textarea
                    value={aiPromptText}
                    onChange={(e) => setAiPromptText(e.target.value)}
                    onKeyDown={handlePromptKeyDown}
                    placeholder="e.g., When a new high-priority ticket from a VIP client comes in on the Professional Services board, post it to #vip-support and auto-prioritize it…"
                  />
                  <div className="ai-form-foot">
                    <span className="hint">Press ⌘ + Enter to generate</span>
                    <button
                      type="button"
                      className="generate-btn"
                      onClick={generate}
                      disabled={!aiPromptText.trim()}
                    >
                      <IconBolt />
                      Generate flow
                    </button>
                  </div>
                </div>
                <div className="examples">
                  <span className="label">Try one of these</span>
                  <button
                    type="button"
                    className="example-chip example-chip--primary"
                    onClick={applyQuickAutoRoute}
                  >
                    {QUICK_AUTO_ROUTE_PROMPT}
                  </button>
                  {AI_EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="example-chip"
                      onClick={() => setAiPromptText(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aiState === "generating" && (
              <div className="ai-generating">
                <div className="spinner" />
                <p className="building">Building your flow…</p>
              </div>
            )}

            {aiState === "result" && (
              <div
                className={
                  aiAction === "Auto-route" ? "result-layout" : undefined
                }
              >
                <div className="result-main">
                  <FlowStack
                    key={`${aiGenerationId}-${aiBuildKind}`}
                    ai
                    flowOverrides={
                      aiBuildKind === "quick" ? QUICK_AUTO_ROUTE_OVERRIDES : null
                    }
                    selectedAction={aiAction}
                    onSelectAction={setAiAction}
                  />
                  <div className="ai-actions-bar">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={generate}
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      className="generate-btn"
                      onClick={handleAiSave}
                    >
                      {aiSaveLabel === "Save flow" ? (
                        <>
                          <IconBolt />
                          {aiSaveLabel}
                        </>
                      ) : (
                        aiSaveLabel
                      )}
                    </button>
                  </div>
                </div>
                {aiAction === "Auto-route" && (
                  <div className="super-panel-slot">
                    <SuperAgentPanel
                      key={aiGenerationId}
                      initialPrompt={aiResultPrompt}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
