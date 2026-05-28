import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ListOrdered,
  Search,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { TeamLabel } from "../TeamIcon";
import ThreadCard from "../ThreadCard";
import {
  MAX_TEST_THREADS,
  computeTestAgentRanking,
  TEST_AGENT_THREADS,
  getTestAgentThread,
  groupThreadIdsByTeam,
  sortThreadsByRanking,
} from "./testAgentThreads";

const FEEDBACK_SUBMIT_DELAY_MS = 900;

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

function ThreadCardList({ threads, hasRunTest, rankingById, onRemoveThread }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {threads.map((thread) => {
        const ranking = hasRunTest ? rankingById?.[thread.id] : undefined;

        return (
          <ThreadCard
            key={thread.id}
            thread={thread}
            ranking={ranking}
            onRemove={onRemoveThread}
          />
        );
      })}
    </div>
  );
}

export default function TestAgentPanel({
  configuredTeams = [],
  agentInstructions = "",
  rankingSignals = [],
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
  const canRunTest = selectedIds.length >= 2;

  const groupByTeam = configuredTeams.length >= 2;
  const rankingById = useMemo(
    () =>
      hasRunTest
        ? computeTestAgentRanking(selectedIds, rankingSignals)
        : {},
    [hasRunTest, rankingSignals, selectedIds]
  );

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
      threads: section.threadIds
        .map((id) => getTestAgentThread(id))
        .filter(Boolean),
    }));
  }, [configuredTeams, groupByTeam, hasRunTest, rankingSignals, selectedIds]);

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

  const firstSelectableIndex = useMemo(
    () =>
      filteredThreads.findIndex(
        (candidate) => !selectedIds.includes(candidate.id)
      ),
    [filteredThreads, selectedIds]
  );

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
  }, [agentInstructions]);

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
    if (next.length < 2) {
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

  const handleClearAll = () => {
    setSelectedIds([]);
    setSearchQuery("");
    setSearchOpen(false);
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
    hasRunTest && displayedThreads.length > 0 && !feedbackDismissed;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="shrink-0 px-6 pt-6">
        <h2 className="text-base font-medium text-neutral-900">Test agent</h2>
        <p className="mt-1 text-[13px] leading-snug text-neutral-500">
          See how the Dispatch Agent ranks tickets with your current config.
        </p>
      </div>

      <div className="relative z-20 shrink-0 px-6 pt-6">
        <div className="mb-2 text-sm font-medium text-neutral-900">Search</div>
        <div className="flex items-center gap-2">
          <div ref={searchWrapRef} className="relative min-w-0 flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              disabled={atMax}
              placeholder={
                atMax
                  ? "Maximum of 10 threads reached"
                  : "Search from existing threads"
              }
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
                {filteredThreads.length > 0 ? (
                  <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                    {filteredThreads.map((thread, index) => {
                      const isSelected = selectedIds.includes(thread.id);
                      const isPreHighlighted =
                        !isSelected && index === firstSelectableIndex;

                      const itemContent = (
                        <>
                          <div
                            className={`text-sm leading-snug ${
                              isSelected ? "text-neutral-500" : "text-neutral-900"
                            }`}
                          >
                            <span className="font-semibold">{thread.number}</span>{" "}
                            {thread.title}
                          </div>
                          <div className="mt-1 text-xs leading-snug text-neutral-400">
                            <span>{thread.contact}</span>
                            <span className="mx-1.5 text-neutral-300">•</span>
                            <span>{thread.company}</span>
                          </div>
                        </>
                      );

                      return (
                        <li key={thread.id}>
                          {isSelected ? (
                            <div
                              className="flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left"
                              aria-disabled="true"
                            >
                              <Check
                                size={14}
                                strokeWidth={2}
                                className="mt-0.5 shrink-0 text-emerald-600"
                                aria-hidden
                              />
                              <div className="min-w-0 flex-1">{itemContent}</div>
                            </div>
                          ) : (
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
                              {itemContent}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-3 py-4 text-sm text-neutral-500">
                    No matching threads
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            disabled={!canRunTest}
            onClick={handleRunTest}
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white ${
              canRunTest
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "cursor-not-allowed bg-emerald-400 opacity-50"
            }`}
          >
            Run test
          </button>
        </div>
      </div>

      <div className="mx-6 mt-5 shrink-0 border-t border-neutral-200" />

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          {hasRunTest ? (
            <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-neutral-900">
              <span className="truncate">Dispatch Agent&apos;s ranking</span>
            </div>
          ) : (
            <div className="text-sm font-medium text-neutral-900">
              {selectedIds.length > 0
                ? `Threads to test (${selectedIds.length}/${MAX_TEST_THREADS})...`
                : "Threads to test..."}
            </div>
          )}
          {displayedThreads.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              <X size={12} />
              Clear all
            </button>
          ) : null}
        </div>

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

        {displayedThreads.length > 0 ? (
          groupByTeam && teamSections ? (
            <div className="space-y-5">
              {teamSections.map((section) => (
                <section key={section.team}>
                  <div className="mb-2">
                    <TeamLabel team={section.team} />
                  </div>
                  <ThreadCardList
                    threads={section.threads}
                    hasRunTest={hasRunTest}
                    rankingById={rankingById}
                    onRemoveThread={handleRemoveThread}
                  />
                </section>
              ))}
            </div>
          ) : (
            <ThreadCardList
              threads={displayedThreads}
              hasRunTest={hasRunTest}
              rankingById={rankingById}
              onRemoveThread={handleRemoveThread}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 py-16 text-center">
            <ListOrdered
              size={32}
              strokeWidth={1.5}
              className="mb-4 text-neutral-300"
            />
            <p className="max-w-[260px] text-sm leading-snug text-neutral-500">
              Select two or more threads to see how the agent would rank them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
