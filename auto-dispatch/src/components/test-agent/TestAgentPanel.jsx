import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ClipboardList,
  Search,
  ThumbsDown,
  ThumbsUp,
  UserRoundCheck,
  X,
} from "lucide-react";
import { TeamLabel } from "../TeamIcon";
import TeamIcon from "../TeamIcon";
import { PersonAvatar, PreviewThreadRow } from "../ThreadCard";
import {
  MAX_TEST_THREADS,
  TEST_AGENT_THREADS,
  getTestAgentThread,
  groupThreadIdsByTeam,
  sortThreadsByRanking,
} from "./testAgentThreads";
import {
  computeDispatchEligibility,
  formatWorkloadLabel,
} from "./testAgentTechnicians";

const FEEDBACK_SUBMIT_DELAY_MS = 900;
const SHOW_FEEDBACK_BANNER = false;

function TestAgentFeedbackBanner({
  thanks,
  onDismiss,
  onThumbsUp,
  onThumbsDown,
}) {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5">
      {thanks ? (
        <Check
          size={15}
          strokeWidth={2}
          className="shrink-0 text-sky-700"
          aria-hidden
        />
      ) : (
        <div className="flex items-center gap-1.5 text-sky-700">
          <button
            type="button"
            onClick={onThumbsUp}
            className="rounded p-0.5 hover:bg-sky-100"
            aria-label="Thumbs up"
          >
            <ThumbsUp size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onThumbsDown}
            className="rounded p-0.5 hover:bg-sky-100"
            aria-label="Thumbs down"
          >
            <ThumbsDown size={15} strokeWidth={1.75} />
          </button>
        </div>
      )}
      <span className="flex-1 text-sm text-sky-900">
        {thanks ? "Thanks for the feedback!" : "How did the agent do?"}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded p-0.5 text-sky-600 hover:bg-sky-100 hover:text-sky-800"
        aria-label="Dismiss feedback"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function TestAgentFeedbackModal({
  open,
  submitting,
  onCancel,
  onSubmit,
}) {
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    if (!open) {
      setFeedbackText("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      role="presentation"
      onClick={submitting ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-labelledby="feedback-modal-title"
        aria-describedby="feedback-modal-description"
        className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="feedback-modal-title"
          className="text-lg font-semibold text-neutral-900"
        >
          What should the Dispatch Agent do differently?
        </h3>
        <p
          id="feedback-modal-description"
          className="mt-1.5 text-sm leading-relaxed text-neutral-500"
        >
          Your feedback will be added to the agent&apos;s instructions.
        </p>
        <textarea
          value={feedbackText}
          onChange={(event) => setFeedbackText(event.target.value)}
          disabled={submitting}
          placeholder="Describe what the Dispatch Agent should do differently."
          className="mt-4 w-full min-h-[140px] resize-y rounded-md border border-neutral-200 px-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-neutral-50 leading-relaxed"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(feedbackText)}
            disabled={submitting}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TechTeamMeta({ teams = [] }) {
  if (!teams.length) return null;
  return (
    <div className="mt-1 space-y-0.5">
      {teams.map((team) => (
        <div
          key={team}
          className="flex min-w-0 items-center gap-1.5 text-[13px] text-neutral-500"
        >
          <TeamIcon team={team} />
          <span className="truncate">{team}</span>
        </div>
      ))}
    </div>
  );
}

function TechWorkloadFooter({ reason, label }) {
  const toneClass =
    reason === "at_capacity"
      ? "bg-rose-50 text-rose-800"
      : reason === "unavailable"
        ? "bg-amber-50 text-amber-900"
        : "bg-emerald-50 text-emerald-800";

  return (
    <div className={`px-3.5 py-2 text-[13px] ${toneClass}`}>{label}</div>
  );
}

function EligibleTechCard({ tech }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span className="mt-2 w-4 shrink-0 text-center text-sm tabular-nums text-neutral-500">
          {tech.rank}
        </span>
        <PersonAvatar
          initials={tech.initials}
          colorClass={tech.colorClass}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-neutral-900">
              {tech.name}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Available
            </span>
          </div>
          <TechTeamMeta teams={tech.displayTeams} />
        </div>
      </div>
      <TechWorkloadFooter
        reason={null}
        label={formatWorkloadLabel(tech, null)}
      />
    </div>
  );
}

function IneligibleTechCard({ tech }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-start gap-3 px-3.5 py-3">
        <PersonAvatar
          initials={tech.initials}
          colorClass={tech.colorClass}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-neutral-900">
              {tech.name}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" aria-hidden />
              Unavailable
            </span>
          </div>
          <TechTeamMeta teams={tech.displayTeams} />
        </div>
      </div>
      <TechWorkloadFooter reason={tech.reason} label={tech.workloadLabel} />
    </div>
  );
}

function AutoAssignTestPanel({
  configuredTeams = [],
  excludeTechs = [],
  maxActiveThreads = "10",
  onClose,
}) {
  const [hasRunTest, setHasRunTest] = useState(false);

  useEffect(() => {
    setHasRunTest(false);
  }, [configuredTeams, excludeTechs, maxActiveThreads]);

  const results = useMemo(
    () =>
      hasRunTest
        ? computeDispatchEligibility({
            configuredTeams,
            excludeTechs,
            maxActiveThreads,
          })
        : null,
    [configuredTeams, excludeTechs, hasRunTest, maxActiveThreads]
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <h2 className="text-base font-semibold text-neutral-900">Test run</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close test run"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {hasRunTest && results ? (
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">
                Eligible for dispatch
              </h3>
              {results.eligible.length > 0 ? (
                <div className="space-y-3">
                  {results.eligible.map((tech) => (
                    <EligibleTechCard key={tech.id} tech={tech} />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
                  No techs are currently eligible for dispatch.
                </p>
              )}
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">
                Not eligible for dispatch
              </h3>
              {results.notEligible.length > 0 ? (
                <div className="space-y-3">
                  {results.notEligible.map((tech) => (
                    <IneligibleTechCard key={tech.id} tech={tech} />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
                  All selected-team techs are eligible.
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 py-16 text-center">
            <UserRoundCheck
              size={36}
              strokeWidth={1.5}
              className="mb-4 text-neutral-400"
              aria-hidden
            />
            <p className="max-w-[240px] text-sm leading-snug text-neutral-500">
              Run a test to preview your team&apos;s dispatch order.
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-neutral-100 px-5 py-4">
        <button
          type="button"
          onClick={() => setHasRunTest(true)}
          className="w-full rounded-md bg-[#00BB99] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#00A888]"
        >
          Run test
        </button>
      </div>
    </div>
  );
}

export default function TestAgentPanel({
  configuredTeams = [],
  agentInstructions = "",
  rankingSignals = [],
  outputMode = "points",
  maxActiveThreads = "No limit",
  calendarAvailabilityEnabled = false,
  excludeTechs = [],
  onClose,
}) {
  if (outputMode === "recommendation") {
    return (
      <AutoAssignTestPanel
        configuredTeams={configuredTeams}
        excludeTechs={excludeTechs}
        maxActiveThreads={maxActiveThreads}
        onClose={onClose}
      />
    );
  }

  return (
    <NextThreadTestPanel
      configuredTeams={configuredTeams}
      agentInstructions={agentInstructions}
      rankingSignals={rankingSignals}
      maxActiveThreads={maxActiveThreads}
      calendarAvailabilityEnabled={calendarAvailabilityEnabled}
      onClose={onClose}
    />
  );
}

function NextThreadTestPanel({
  configuredTeams = [],
  agentInstructions = "",
  rankingSignals = [],
  maxActiveThreads = "No limit",
  calendarAvailabilityEnabled = false,
  onClose,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasRunTest, setHasRunTest] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);
  const [feedbackThanks, setFeedbackThanks] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const feedbackSubmitTimerRef = useRef(null);
  const resetFeedback = () => {
    if (feedbackSubmitTimerRef.current) {
      clearTimeout(feedbackSubmitTimerRef.current);
      feedbackSubmitTimerRef.current = null;
    }
    setFeedbackThanks(false);
    setFeedbackModalOpen(false);
    setFeedbackSubmitting(false);
    setFeedbackDismissed(false);
  };

  const atMax = selectedIds.length >= MAX_TEST_THREADS;
  const minThreadsForRunTest = 1;
  const canRunTest = selectedIds.length >= minThreadsForRunTest;

  const groupByTeam = configuredTeams.length >= 2;

  const displayedIds = useMemo(() => {
    if (!hasRunTest || groupByTeam) return selectedIds;
    return sortThreadsByRanking(selectedIds, rankingSignals);
  }, [selectedIds, hasRunTest, groupByTeam, rankingSignals]);

  const displayedThreads = useMemo(
    () => displayedIds.map((id) => getTestAgentThread(id)).filter(Boolean),
    [displayedIds]
  );

  const teamSections = useMemo(() => {
    if (!groupByTeam) return null;
    return groupThreadIdsByTeam(selectedIds, configuredTeams, {
      sortByRanking: hasRunTest,
      rankingSignals,
    }).map((section) => ({
      team: section.team,
      threadIds: section.threadIds,
      threads: section.threadIds
        .map((id) => getTestAgentThread(id))
        .filter(Boolean),
    }));
  }, [
    configuredTeams,
    groupByTeam,
    hasRunTest,
    rankingSignals,
    selectedIds,
  ]);

  const teamGroupedThreadCount = useMemo(
    () =>
      teamSections?.reduce((sum, section) => sum + section.threads.length, 0) ??
      0,
    [teamSections]
  );

  const showTeamGroupedThreads =
    groupByTeam &&
    teamSections != null &&
    teamSections.length > 0 &&
    teamGroupedThreadCount === displayedThreads.length;

  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return TEST_AGENT_THREADS.filter((thread) => {
      if (!query) return true;
      return (
        thread.number.toLowerCase().includes(query) ||
        thread.title.toLowerCase().includes(query) ||
        thread.company.toLowerCase().includes(query) ||
        thread.contact.toLowerCase().includes(query) ||
        thread.status.toLowerCase().includes(query) ||
        thread.priority?.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const handleOutsidePointerDown = (event) => {
      const wrap = searchWrapRef.current;
      if (!wrap) return;
      if (event.composedPath().includes(wrap)) return;
      setSearchOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [searchOpen]);

  useEffect(
    () => () => {
      if (feedbackSubmitTimerRef.current) {
        clearTimeout(feedbackSubmitTimerRef.current);
      }
    },
    []
  );

  const draftInstructionsRef = useRef(agentInstructions);
  draftInstructionsRef.current = agentInstructions;

  useEffect(() => {
    setHasRunTest(false);
    if (feedbackSubmitTimerRef.current) {
      clearTimeout(feedbackSubmitTimerRef.current);
      feedbackSubmitTimerRef.current = null;
    }
    setFeedbackThanks(false);
    setFeedbackModalOpen(false);
    setFeedbackSubmitting(false);
    setFeedbackDismissed(false);
  }, [agentInstructions, calendarAvailabilityEnabled, maxActiveThreads]);

  const handleSelectThread = (threadId) => {
    if (selectedIds.includes(threadId)) return;
    if (selectedIds.length >= MAX_TEST_THREADS) return;
    setSelectedIds((prev) => [...prev, threadId]);
    setSearchQuery("");
    setSearchOpen(true);
    searchInputRef.current?.focus();
  };

  const handleRemoveThread = (threadId) => {
    const next = selectedIds.filter((id) => id !== threadId);
    if (next.length < minThreadsForRunTest) {
      setHasRunTest(false);
      resetFeedback();
    }
    setSelectedIds(next);
  };

  const handleRunTest = () => {
    if (!canRunTest) return;
    void draftInstructionsRef.current;
    setHasRunTest(true);
    resetFeedback();
  };

  const handleReset = () => {
    setHasRunTest(false);
    resetFeedback();
  };

  const handleThumbsUp = () => {
    setFeedbackThanks(true);
  };

  const handleThumbsDown = () => {
    setFeedbackModalOpen(true);
  };

  const handleFeedbackModalCancel = () => {
    if (feedbackSubmitting) return;
    setFeedbackModalOpen(false);
  };

  const handleFeedbackModalSubmit = () => {
    if (feedbackSubmitting) return;
    setFeedbackSubmitting(true);
    feedbackSubmitTimerRef.current = setTimeout(() => {
      feedbackSubmitTimerRef.current = null;
      setFeedbackSubmitting(false);
      setFeedbackModalOpen(false);
      setFeedbackThanks(true);
    }, FEEDBACK_SUBMIT_DELAY_MS);
  };

  const showFeedbackBanner =
    SHOW_FEEDBACK_BANNER &&
    hasRunTest &&
    displayedThreads.length > 0 &&
    !feedbackDismissed;

  const searchPlaceholder = atMax
    ? "Maximum of 10 threads reached"
    : "Search by ticket number or summary";

  const previewDropdownThreads = useMemo(
    () => filteredThreads.filter((thread) => !selectedIds.includes(thread.id)),
    [filteredThreads, selectedIds]
  );

  const previewFirstSelectableIndex = useMemo(
    () => (previewDropdownThreads.length > 0 ? 0 : -1),
    [previewDropdownThreads.length]
  );

  const renderSearchDropdownItem = (thread, index) => {
    const isPreHighlighted = index === previewFirstSelectableIndex;

    return (
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.stopPropagation();
          handleSelectThread(thread.id);
        }}
        className={`w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-neutral-100 ${
          isPreHighlighted ? "bg-neutral-100" : ""
        }`}
      >
        <div className="text-sm font-medium leading-snug text-neutral-900">
          {thread.title}
        </div>
        <div className="mt-0.5 text-xs leading-snug text-neutral-500">
          {thread.number} • {thread.company}
        </div>
      </button>
    );
  };

  const searchInput = (
    <div ref={searchWrapRef} className="relative min-w-0 w-full">
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
      />
      <input
        ref={searchInputRef}
        type="text"
        value={searchQuery}
        disabled={atMax}
        placeholder={searchPlaceholder}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => {
          if (!atMax) setSearchOpen(true);
        }}
        onFocus={() => {
          if (!atMax) setSearchOpen(true);
        }}
        onChange={(event) => {
          setSearchQuery(event.target.value);
          if (!atMax) setSearchOpen(true);
        }}
        className={`w-full rounded-md border border-neutral-200 py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          atMax ? "cursor-not-allowed bg-neutral-50 text-neutral-400" : ""
        }`}
      />
      {searchOpen ? (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {previewDropdownThreads.length > 0 ? (
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {previewDropdownThreads.map((thread, index) => (
                <li key={thread.id}>
                  {renderSearchDropdownItem(thread, index)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-sm text-neutral-500">No matching threads</div>
          )}
        </div>
      ) : null}
    </div>
  );

  const runTestButton = (
    <button
      type="button"
      disabled={!canRunTest}
      onClick={handleRunTest}
      className={`w-full rounded-md px-4 py-2.5 text-sm font-medium text-white ${
        canRunTest
          ? "bg-emerald-500 hover:bg-emerald-600"
          : "cursor-not-allowed bg-emerald-400 opacity-50"
      }`}
    >
      Run test
    </button>
  );

  const previewSelectedThreads = useMemo(
    () => selectedIds.map((id) => getTestAgentThread(id)).filter(Boolean),
    [selectedIds]
  );

  const renderPreviewRows = (threads, showRank) =>
    threads.map((thread, index) => (
      <PreviewThreadRow
        key={thread.id}
        thread={thread}
        rank={showRank ? index + 1 : undefined}
        onRemove={showRank ? undefined : handleRemoveThread}
      />
    ));

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 px-6 pt-6">
        <h2 className="text-base font-semibold text-neutral-900">Preview</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="relative z-20 shrink-0 px-6 pt-4">{searchInput}</div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-4">
        {showFeedbackBanner ? (
          <TestAgentFeedbackBanner
            thanks={feedbackThanks}
            onThumbsUp={handleThumbsUp}
            onThumbsDown={handleThumbsDown}
            onDismiss={() => setFeedbackDismissed(true)}
          />
        ) : null}

        <TestAgentFeedbackModal
          open={feedbackModalOpen}
          submitting={feedbackSubmitting}
          onCancel={handleFeedbackModalCancel}
          onSubmit={handleFeedbackModalSubmit}
        />

        {previewSelectedThreads.length > 0 ? (
          showTeamGroupedThreads ? (
            <div className="space-y-5">
              {teamSections.map((section) => (
                <section key={section.team}>
                  <div className="mb-2">
                    <TeamLabel team={section.team} />
                  </div>
                  {renderPreviewRows(section.threads, hasRunTest)}
                </section>
              ))}
            </div>
          ) : (
            <div>
              {!hasRunTest ? (
                <h3 className="mb-1 text-sm font-semibold text-neutral-900">Selected</h3>
              ) : null}
              {renderPreviewRows(
                hasRunTest ? displayedThreads : previewSelectedThreads,
                hasRunTest
              )}
            </div>
          )
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 py-16 text-center">
            <ClipboardList
              size={32}
              strokeWidth={1.5}
              className="mb-4 text-neutral-400"
            />
            <p className="max-w-[280px] text-sm leading-snug text-neutral-500">
              Search for threads to see how your scoring rules would prioritize them.
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 px-6 pb-6 pt-2">
        {hasRunTest ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-md border border-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              Reset
            </button>
            <button
              type="button"
              disabled={!canRunTest}
              onClick={handleRunTest}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium text-white ${
                canRunTest
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "cursor-not-allowed bg-emerald-400 opacity-50"
              }`}
            >
              Run test
            </button>
          </div>
        ) : (
          runTestButton
        )}
      </div>
    </div>
  );
}
