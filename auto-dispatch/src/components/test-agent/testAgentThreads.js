/** Single source of truth for Test agent panel thread mock data. */
export const TEST_AGENT_THREADS = [
  {
    id: "1234",
    number: "#1234",
    title: "Network connectivity issue",
    company: "Acme Corp",
    contact: "John Smith",
    contactInitials: "JS",
    contactColor: "bg-sky-100 text-sky-700",
    message: "Multiple users are experiencing an outage - c...",
    timestamp: "30m ago",
    status: "IN PROGRESS",
    priority: "P3",
    typeColor: "bg-yellow-400",
    assigneeInitials: "AR",
    assigneeColor: "bg-violet-100 text-violet-700",
    slaLabel: "At risk",
    sentiment: "negative",
    hasNotification: true,
    contactType: "VIP",
    companyType: "Managed Service",
    agreementType: "Managed Service",
  },
  {
    id: "1236",
    number: "#1236",
    title: "VPN Connection Issue",
    company: "SpaceX",
    contact: "Sarah Connor",
    contactInitials: "SC",
    contactColor: "bg-rose-100 text-rose-700",
    message: "Unable to connect to corporate VPN from home...",
    timestamp: "45m ago",
    status: "NEW",
    priority: "P1",
    typeColor: "bg-red-500",
    assigneeInitials: "LP",
    assigneeColor: "bg-amber-100 text-amber-800",
    slaLabel: "Breaching",
    sentiment: "negative",
    hasNotification: true,
    contactType: "VIP",
    companyType: "Managed Service",
    agreementType: "Managed Service",
  },
  {
    id: "1237",
    number: "#1237",
    title: "Microsoft Teams completely blocked",
    company: "Tesla Motors",
    contact: "Mike Johnson",
    contactInitials: "MJ",
    contactColor: "bg-emerald-100 text-emerald-700",
    message: "Teams won't load after the latest Windows update...",
    timestamp: "1h ago",
    status: "NEW",
    priority: "P2",
    typeColor: "bg-amber-400",
    assigneeInitials: "NK",
    assigneeColor: "bg-cyan-100 text-cyan-800",
    slaLabel: "On time",
    sentiment: "neutral",
    hasNotification: false,
    contactType: "Standard",
    companyType: "Break Fix",
    agreementType: "Time and materials",
  },
  {
    id: "1238",
    number: "#1238",
    title: "I still have VPN issues",
    company: "Acme Corp",
    contact: "Jane Doe",
    contactInitials: "JD",
    contactColor: "bg-indigo-100 text-indigo-700",
    message: "Following up on yesterday's ticket — VPN still drops...",
    timestamp: "2h ago",
    status: "IN PROGRESS",
    priority: "P1",
    typeColor: "bg-red-500",
    assigneeInitials: "MS",
    assigneeColor: "bg-pink-100 text-pink-700",
    slaLabel: "Breached",
    sentiment: "negative",
    hasNotification: true,
    contactType: "Standard",
    companyType: "Managed Service",
    agreementType: "Time and materials",
  },
  {
    id: "1239",
    number: "#1239",
    title: "Can't log into Quickbooks",
    company: "Netflix",
    contact: "Bob Wilson",
    contactInitials: "BW",
    contactColor: "bg-orange-100 text-orange-800",
    message: "Getting an authentication error when opening Quickbooks...",
    timestamp: "15m ago",
    status: "NEW",
    priority: "P4",
    typeColor: "bg-blue-500",
    assigneeInitials: "TR",
    assigneeColor: "bg-teal-100 text-teal-700",
    slaLabel: "On time",
    sentiment: "positive",
    hasNotification: false,
    contactType: "Standard",
    companyType: "Managed Service",
    agreementType: "Time and materials",
  },
  {
    id: "1240",
    number: "#1240",
    title: "Outlook not syncing emails",
    company: "Apple",
    contact: "Emily Davis",
    contactInitials: "ED",
    contactColor: "bg-fuchsia-100 text-fuchsia-700",
    message: "Inbox stopped updating this morning — send/receive fails...",
    timestamp: "3h ago",
    status: "IN PROGRESS",
    priority: "P2",
    typeColor: "bg-amber-400",
    assigneeInitials: "KC",
    assigneeColor: "bg-lime-100 text-lime-800",
    slaLabel: "At risk",
    sentiment: "negative",
    hasNotification: true,
    contactType: "Standard",
    companyType: "Internal",
    agreementType: "Monitoring",
  },
  {
    id: "1241",
    number: "#1241",
    title: "Laptop won't turn on",
    company: "Microsoft",
    contact: "Chris Lee",
    contactInitials: "CL",
    contactColor: "bg-blue-100 text-blue-700",
    message: "Device is completely unresponsive after overnight charge...",
    timestamp: "4h ago",
    status: "IN PROGRESS",
    priority: "P1",
    typeColor: "bg-red-500",
    assigneeInitials: "DW",
    assigneeColor: "bg-orange-100 text-orange-800",
    slaLabel: "Breaching",
    sentiment: "neutral",
    hasNotification: false,
    contactType: "Executive",
    companyType: "Managed Service",
    agreementType: "Managed Service",
  },
  {
    id: "1242",
    number: "#1242",
    title: "Slow internet on all devices",
    company: "Amazon",
    contact: "Anna White",
    contactInitials: "AW",
    contactColor: "bg-yellow-100 text-yellow-800",
    message: "Wi-Fi is usable but very slow across the office floor...",
    timestamp: "4h ago",
    status: "WAITING CLIENT RESPONSE",
    priority: "P4",
    typeColor: "bg-blue-500",
    assigneeInitials: "RB",
    assigneeColor: "bg-slate-100 text-slate-700",
    slaLabel: "On time",
    sentiment: "positive",
    hasNotification: false,
    contactType: "Standard",
    companyType: "Managed Service",
    agreementType: "Time and materials",
  },
  {
    id: "1243",
    number: "#1243",
    title: "Printer offline after update",
    company: "Salesforce",
    contact: "Tom Brown",
    contactInitials: "TB",
    contactColor: "bg-teal-100 text-teal-700",
    message: "Shared printer shows offline since the driver update...",
    timestamp: "2h ago",
    status: "WAITING CLIENT RESPONSE",
    priority: "P3",
    typeColor: "bg-yellow-400",
    assigneeInitials: "GH",
    assigneeColor: "bg-indigo-100 text-indigo-700",
    slaLabel: "At risk",
    sentiment: "neutral",
    hasNotification: false,
    contactType: "Standard",
    companyType: "Government",
    agreementType: "Time and materials",
  },
  {
    id: "1244",
    number: "#1244",
    title: "Two factor auth not working",
    company: "Adobe",
    contact: "Lisa Green",
    contactInitials: "LG",
    contactColor: "bg-green-100 text-green-700",
    message: "Authenticator codes are being rejected at login...",
    timestamp: "1h ago",
    status: "NEW",
    priority: "P2",
    typeColor: "bg-amber-400",
    assigneeInitials: "PM",
    assigneeColor: "bg-rose-100 text-rose-700",
    slaLabel: "Breached",
    sentiment: "negative",
    hasNotification: true,
    contactType: "VIP",
    companyType: "Managed Service",
    agreementType: "Managed Service",
  },
];

export const MAX_TEST_THREADS = 10;

export const DEFAULT_TEST_AGENT_SIGNALS = [
  { id: "priority", enabled: true, value: 18 },
  { id: "sla-risk", enabled: true, value: 25 },
  { id: "ticket-age", enabled: true, value: 10 },
  { id: "client-replied", enabled: true, value: 20 },
  { id: "sentiment", enabled: true, value: 12 },
  { id: "contact-type", enabled: true, value: 8 },
  { id: "company-type", enabled: true, value: 7 },
  { id: "agreement-type", enabled: true, value: 0 },
];

/** Mock inbox team per thread for multi-team test agent ranking. */
export const TEST_AGENT_THREAD_TEAMS = {
  1234: "Team Alpha",
  1237: "Team Alpha",
  1240: "Team Alpha",
  1241: "Team Alpha",
  1244: "Team Alpha",
  1236: "Team Beta",
  1238: "Team Beta",
  1239: "Team Beta",
  1242: "Team Beta",
  1243: "Team Beta",
};

export function getTestAgentThreadTeam(threadId) {
  return TEST_AGENT_THREAD_TEAMS[threadId] ?? null;
}

const SLA_RISK_BY_LABEL = {
  Breached: { factor: 1, label: "SLA breached" },
  Breaching: { factor: 0.85, label: "SLA breaching" },
  "At risk": { factor: 0.6, label: "SLA at risk" },
  "On time": { factor: 0, label: "On time" },
};

/** Blue dot = client sent last message, awaiting tech response. Drives client-replied ranking. */
function getClientRepliedSignal(thread) {
  if (thread?.hasNotification) {
    return { factor: 1, label: "Unanswered client reply" };
  }
  return { factor: 0.15, label: "Tech replied last" };
}

function getSlaRiskSignal(thread) {
  return SLA_RISK_BY_LABEL[thread?.slaLabel] ?? SLA_RISK_BY_LABEL["On time"];
}

function getRankingSignalConfig(rankingSignals, signalId) {
  if (!Array.isArray(rankingSignals)) return undefined;
  return rankingSignals.find((signal) => signal.id === signalId);
}

function hasDropdownSelection(selectedOption) {
  return typeof selectedOption === "string" && selectedOption.trim() !== "";
}

/** Match multi-select filter from Thread scoring: match = 1, no selection = 0, mismatch = 0. */
function getSignalSelectedOptions(signalConfig) {
  if (Array.isArray(signalConfig?.selectedOptions) && signalConfig.selectedOptions.length > 0) {
    return signalConfig.selectedOptions;
  }
  if (hasDropdownSelection(signalConfig?.selectedOption)) {
    return [signalConfig.selectedOption];
  }
  return [];
}

function getMultiSelectFilterSignal(threadValue, selectedOptions, { matchLabel, noSelectionFactor = 0 }) {
  const selections = Array.isArray(selectedOptions)
    ? selectedOptions.filter((opt) => typeof opt === "string" && opt.trim() !== "")
    : [];
  if (selections.length === 0) {
    return { factor: noSelectionFactor, label: null };
  }
  if (selections.includes(threadValue)) {
    return { factor: 1, label: matchLabel(threadValue) };
  }
  return { factor: 0, label: null };
}

function getContactTypeSignal(thread, signalConfig) {
  return getMultiSelectFilterSignal(thread?.contactType, getSignalSelectedOptions(signalConfig), {
    matchLabel: (contactType) => `${contactType} contact`,
  });
}

function getCompanyTypeSignal(thread, signalConfig) {
  return getMultiSelectFilterSignal(thread?.companyType, getSignalSelectedOptions(signalConfig), {
    matchLabel: (companyType) => `${companyType} company`,
  });
}

function getAgreementTypeSignal(thread, signalConfig) {
  return getMultiSelectFilterSignal(thread?.agreementType, getSignalSelectedOptions(signalConfig), {
    matchLabel: (agreementType) => `${agreementType} agreement`,
  });
}

function buildThreadFactors(thread, rankingSignals) {
  return {
    ...(TEST_THREAD_SIGNAL_FACTORS[thread?.id] ?? {}),
    "sla-risk": getSlaRiskSignal(thread),
    "client-replied": getClientRepliedSignal(thread),
    "contact-type": getContactTypeSignal(
      thread,
      getRankingSignalConfig(rankingSignals, "contact-type")
    ),
    "company-type": getCompanyTypeSignal(
      thread,
      getRankingSignalConfig(rankingSignals, "company-type")
    ),
    "agreement-type": getAgreementTypeSignal(
      thread,
      getRankingSignalConfig(rankingSignals, "agreement-type")
    ),
  };
}

const TEST_THREAD_SIGNAL_FACTORS = {
  1236: {
    priority: { factor: 1, label: "P1 priority" },
    sentiment: { factor: 0.95, label: "Negative client sentiment" },
    "ticket-age": { factor: 0.35, label: "45m old ticket" },
  },
  1238: {
    priority: { factor: 1, label: "P1 priority" },
    sentiment: { factor: 0.9, label: "Negative client sentiment" },
    "ticket-age": { factor: 0.6, label: "2h old ticket" },
  },
  1244: {
    priority: { factor: 0.75, label: "P2 priority" },
    sentiment: { factor: 0.85, label: "Negative client sentiment" },
    "ticket-age": { factor: 0.45, label: "1h old ticket" },
  },
  1241: {
    priority: { factor: 1, label: "P1 priority" },
    sentiment: { factor: 0.45, label: "Neutral client sentiment" },
    "ticket-age": { factor: 0.85, label: "4h old ticket" },
  },
  1234: {
    priority: { factor: 0.5, label: "P3 priority" },
    sentiment: { factor: 0.8, label: "Negative client sentiment" },
    "ticket-age": { factor: 0.25, label: "30m old ticket" },
  },
  1240: {
    priority: { factor: 0.75, label: "P2 priority" },
    sentiment: { factor: 0.85, label: "Negative client sentiment" },
    "ticket-age": { factor: 0.75, label: "3h old ticket" },
  },
  1243: {
    priority: { factor: 0.5, label: "P3 priority" },
    sentiment: { factor: 0.45, label: "Neutral client sentiment" },
    "ticket-age": { factor: 0.6, label: "2h old ticket" },
  },
  1237: {
    priority: { factor: 0.75, label: "P2 priority" },
    sentiment: { factor: 0.45, label: "Neutral client sentiment" },
    "ticket-age": { factor: 0.45, label: "1h old ticket" },
  },
  1239: {
    priority: { factor: 0.25, label: "P4 priority" },
    sentiment: { factor: 0.15, label: "Positive client sentiment" },
    "ticket-age": { factor: 0.2, label: "15m old ticket" },
  },
  1242: {
    priority: { factor: 0.25, label: "P4 priority" },
    sentiment: { factor: 0.15, label: "Positive client sentiment" },
    "ticket-age": { factor: 0.85, label: "4h old ticket" },
  },
};

const threadById = new Map(TEST_AGENT_THREADS.map((thread) => [thread.id, thread]));

export function getTestAgentThread(id) {
  return threadById.get(id);
}

export function getRankingWeightTotal(rankingSignals) {
  return normalizeSignals(rankingSignals).reduce(
    (sum, signal) => sum + (Number(signal.value) || 0),
    0
  );
}

function normalizeSignals(rankingSignals) {
  const savedById = new Map(
    Array.isArray(rankingSignals)
      ? rankingSignals.map((signal) => [signal.id, signal])
      : []
  );

  return DEFAULT_TEST_AGENT_SIGNALS.map((signal) => {
    const saved = savedById.get(signal.id);
    const value = Number(saved?.value);
    const migratedValue =
      saved?.enabled === false && !Number.isFinite(value) ? 0 : value;

    return {
      ...signal,
      enabled: true,
      value: Number.isFinite(migratedValue)
        ? Math.max(0, Math.min(100, migratedValue))
        : signal.value,
    };
  });
}

export function computeTestAgentRanking(threadIds, rankingSignals) {
  const normalizedSignals = normalizeSignals(rankingSignals);
  const scoreMax = getRankingWeightTotal(rankingSignals);
  const scored = threadIds.map((threadId, originalIndex) => {
    const thread = getTestAgentThread(threadId);
    const factors = buildThreadFactors(thread, rankingSignals);
    const contributions = normalizedSignals
      .filter((signal) => signal.value > 0)
      .map((signal) => {
        const signalFactor = factors[signal.id]?.factor ?? 0;
        const rawPoints = signal.value * signalFactor;
        return {
          ...signal,
          points: rawPoints,
          label: factors[signal.id]?.label ?? null,
        };
      });

    const score = Math.round(
      contributions.reduce((sum, contribution) => sum + contribution.points, 0)
    );
    const reasoning = contributions
      .filter((contribution) => contribution.points > 0 && contribution.label)
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
      .map((contribution) => contribution.label)
      .join(", ");

    return {
      threadId,
      score,
      reasoning,
      originalIndex,
    };
  });

  const ranked = scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.originalIndex - b.originalIndex;
  });

  return ranked.reduce((acc, item, index) => {
    acc[item.threadId] = {
      rank: index + 1,
      score: item.score,
      scoreMax,
      reasoning: item.reasoning,
    };
    return acc;
  }, {});
}

export function sortThreadsByRanking(threadIds, rankingSignals) {
  const rankingById = computeTestAgentRanking(threadIds, rankingSignals);
  return [...threadIds].sort((a, b) => {
    const rankA = rankingById[a]?.rank ?? Number.MAX_SAFE_INTEGER;
    const rankB = rankingById[b]?.rank ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return threadIds.indexOf(a) - threadIds.indexOf(b);
  });
}

export function groupThreadIdsByTeam(
  threadIds,
  teamOrder,
  { sortByRanking = true, rankingSignals } = {}
) {
  const byTeam = new Map(teamOrder.map((team) => [team, []]));
  threadIds.forEach((id) => {
    const team = getTestAgentThreadTeam(id);
    if (team && byTeam.has(team)) {
      byTeam.get(team).push(id);
    }
  });
  return teamOrder
    .map((team) => {
      const ids = byTeam.get(team) ?? [];
      return {
        team,
        threadIds: sortByRanking ? sortThreadsByRanking(ids, rankingSignals) : ids,
      };
    })
    .filter((section) => section.threadIds.length > 0);
}
