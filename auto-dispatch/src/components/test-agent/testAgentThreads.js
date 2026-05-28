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
    statusClass: "bg-sky-100 text-sky-800",
    priority: "P3",
    typeColor: "bg-yellow-400",
    assigneeInitials: "AR",
    assigneeColor: "bg-violet-100 text-violet-700",
    slaLabel: "On time",
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
    statusClass: "bg-neutral-100 text-neutral-700",
    priority: "P1",
    typeColor: "bg-red-500",
    assigneeInitials: "LP",
    assigneeColor: "bg-amber-100 text-amber-800",
    slaLabel: "On time",
    hasNotification: true,
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
    statusClass: "bg-neutral-100 text-neutral-700",
    priority: "P2",
    typeColor: "bg-amber-400",
    assigneeInitials: "NK",
    assigneeColor: "bg-cyan-100 text-cyan-800",
    slaLabel: "On time",
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
    statusClass: "bg-sky-100 text-sky-800",
    priority: "P3",
    typeColor: "bg-yellow-400",
    assigneeInitials: "MS",
    assigneeColor: "bg-pink-100 text-pink-700",
    slaLabel: "On time",
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
    statusClass: "bg-neutral-100 text-neutral-700",
    priority: "P4",
    typeColor: "bg-blue-500",
    assigneeInitials: "TR",
    assigneeColor: "bg-teal-100 text-teal-700",
    slaLabel: "On time",
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
    statusClass: "bg-sky-100 text-sky-800",
    priority: "P2",
    typeColor: "bg-amber-400",
    assigneeInitials: "KC",
    assigneeColor: "bg-lime-100 text-lime-800",
    slaLabel: "On time",
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
    timestamp: "20m ago",
    status: "NEW",
    statusClass: "bg-neutral-100 text-neutral-700",
    priority: "P1",
    typeColor: "bg-red-500",
    assigneeInitials: "DW",
    assigneeColor: "bg-orange-100 text-orange-800",
    slaLabel: "On time",
    hasNotification: true,
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
    status: "IN PROGRESS",
    statusClass: "bg-sky-100 text-sky-800",
    priority: "P4",
    typeColor: "bg-blue-500",
    assigneeInitials: "RB",
    assigneeColor: "bg-slate-100 text-slate-700",
    slaLabel: "On time",
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
    timestamp: "1h ago",
    status: "NEW",
    statusClass: "bg-neutral-100 text-neutral-700",
    priority: "P3",
    typeColor: "bg-yellow-400",
    assigneeInitials: "GH",
    assigneeColor: "bg-indigo-100 text-indigo-700",
    slaLabel: "On time",
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
    timestamp: "50m ago",
    status: "NEW",
    statusClass: "bg-neutral-100 text-neutral-700",
    priority: "P2",
    typeColor: "bg-amber-400",
    assigneeInitials: "PM",
    assigneeColor: "bg-rose-100 text-rose-700",
    slaLabel: "On time",
  },
];

export const MAX_TEST_THREADS = 10;
const BASE_POINTS_BY_POSITION = [100, 85, 70, 55, 40, 25];

export const DEFAULT_TEST_AGENT_SIGNALS = [
  { id: "sla-risk", enabled: true, value: 80 },
  { id: "priority", enabled: true, value: 75 },
  { id: "client-replied", enabled: true, value: 70 },
  { id: "contact-type", enabled: true, value: 65 },
  { id: "ticket-age", enabled: true, value: 50 },
  { id: "agreement-type", enabled: true, value: 40 },
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

const TEST_THREAD_SIGNAL_FACTORS = {
  1236: {
    "sla-risk": { factor: 1, label: "SLA breaching" },
    priority: { factor: 1, label: "P1 priority" },
    "client-replied": { factor: 0.6, label: "No client reply" },
    "contact-type": { factor: 1, label: "VIP contact" },
    "ticket-age": { factor: 0.35, label: "45m old ticket" },
    "agreement-type": { factor: 1, label: "Managed Service agreement" },
  },
  1234: {
    "sla-risk": { factor: 0.85, label: "SLA at risk" },
    priority: { factor: 0.5, label: "P3 priority" },
    "client-replied": { factor: 1, label: "Unanswered client reply" },
    "contact-type": { factor: 1, label: "VIP contact" },
    "ticket-age": { factor: 0.25, label: "30m old ticket" },
    "agreement-type": { factor: 1, label: "Managed Service agreement" },
  },
  1240: {
    "sla-risk": { factor: 0, label: "No SLA risk" },
    priority: { factor: 0.75, label: "P2 priority" },
    "client-replied": { factor: 1, label: "Unanswered client reply" },
    "contact-type": { factor: 0.45, label: "Standard contact" },
    "ticket-age": { factor: 0.75, label: "3h old ticket" },
    "agreement-type": { factor: 0.6, label: "Monitoring agreement" },
  },
  1237: {
    "sla-risk": { factor: 0, label: "No SLA risk" },
    priority: { factor: 0.75, label: "P2 priority" },
    "client-replied": { factor: 0.9, label: "No client reply" },
    "contact-type": { factor: 0.45, label: "Standard contact" },
    "ticket-age": { factor: 0.45, label: "1h old ticket" },
    "agreement-type": { factor: 0.4, label: "Time and materials agreement" },
  },
  1238: {
    "sla-risk": { factor: 0, label: "No SLA risk" },
    priority: { factor: 0.5, label: "P3 priority" },
    "client-replied": { factor: 1, label: "Unanswered client reply" },
    "contact-type": { factor: 0.45, label: "Standard contact" },
    "ticket-age": { factor: 0.6, label: "2h old ticket" },
    "agreement-type": { factor: 0.4, label: "Time and materials agreement" },
  },
  1239: {
    "sla-risk": { factor: 0, label: "No SLA risk" },
    priority: { factor: 0.25, label: "P4 priority" },
    "client-replied": { factor: 0.9, label: "No client reply" },
    "contact-type": { factor: 0.45, label: "Standard contact" },
    "ticket-age": { factor: 0.2, label: "15m old ticket" },
    "agreement-type": { factor: 0.4, label: "Time and materials agreement" },
  },
  1241: {
    "sla-risk": { factor: 0.9, label: "SLA at risk" },
    priority: { factor: 1, label: "P1 priority" },
    "client-replied": { factor: 0.85, label: "No client reply" },
    "contact-type": { factor: 0.9, label: "Executive contact" },
    "ticket-age": { factor: 0.3, label: "20m old ticket" },
    "agreement-type": { factor: 0.8, label: "Managed Service agreement" },
  },
  1242: {
    "sla-risk": { factor: 0, label: "No SLA risk" },
    priority: { factor: 0.25, label: "P4 priority" },
    "client-replied": { factor: 0.65, label: "Client replied recently" },
    "contact-type": { factor: 0.45, label: "Standard contact" },
    "ticket-age": { factor: 0.85, label: "4h old ticket" },
    "agreement-type": { factor: 0.4, label: "Time and materials agreement" },
  },
  1243: {
    "sla-risk": { factor: 0.2, label: "SLA stable" },
    priority: { factor: 0.5, label: "P3 priority" },
    "client-replied": { factor: 0.75, label: "No client reply" },
    "contact-type": { factor: 0.45, label: "Standard contact" },
    "ticket-age": { factor: 0.45, label: "1h old ticket" },
    "agreement-type": { factor: 0.4, label: "Time and materials agreement" },
  },
  1244: {
    "sla-risk": { factor: 0.55, label: "SLA at risk" },
    priority: { factor: 0.75, label: "P2 priority" },
    "client-replied": { factor: 0.8, label: "No client reply" },
    "contact-type": { factor: 0.55, label: "VIP contact" },
    "ticket-age": { factor: 0.4, label: "50m old ticket" },
    "agreement-type": { factor: 0.7, label: "Managed Service agreement" },
  },
};

const threadById = new Map(TEST_AGENT_THREADS.map((thread) => [thread.id, thread]));

export function getTestAgentThread(id) {
  return threadById.get(id);
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
    return {
      ...signal,
      enabled: typeof saved?.enabled === "boolean" ? saved.enabled : signal.enabled,
      value: Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : signal.value,
    };
  });
}

export function computeTestAgentRanking(threadIds, rankingSignals) {
  const normalizedSignals = normalizeSignals(rankingSignals);
  const scored = threadIds.map((threadId, originalIndex) => {
    const factors = TEST_THREAD_SIGNAL_FACTORS[threadId] ?? {};
    const contributions = normalizedSignals.map((signal, index) => {
      const basePoints = BASE_POINTS_BY_POSITION[index] ?? 0;
      if (!signal.enabled) {
        return { ...signal, basePoints, points: 0, label: null };
      }
      const signalFactor = factors[signal.id]?.factor ?? 0;
      const rawPoints = (signal.value / 100) * basePoints * signalFactor;
      return {
        ...signal,
        basePoints,
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
