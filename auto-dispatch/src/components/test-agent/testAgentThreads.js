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

/** Mock dispatch ranking applied when the user runs a test. */
export const TEST_AGENT_RANKING = {
  1241: {
    rank: 1,
    reasoning:
      "P1 priority, device completely down. New ticket with no owner assigned.",
  },
  1236: {
    rank: 2,
    reasoning:
      "P1 priority, critical outage with no workaround. Oldest unresolved ticket in queue.",
  },
  1244: {
    rank: 3,
    reasoning:
      "P2 priority, authentication blocked. Customer unable to access critical systems.",
  },
  1237: {
    rank: 4,
    reasoning:
      "P2 priority, service down for multiple users. No response from tech in 45 minutes.",
  },
  1240: {
    rank: 5,
    reasoning:
      "P2 priority, unanswered reply from 3 hours ago. Thread SLA breaches in 45 minutes.",
  },
  1234: {
    rank: 6,
    reasoning:
      "P3 priority, VIP contact with an unanswered reply. Thread SLA breaches in 30 minutes.",
  },
  1238: {
    rank: 7,
    reasoning:
      "P3 priority, follow-up on an existing ticket. Customer waiting 2 hours with no response.",
  },
  1243: {
    rank: 8,
    reasoning:
      "P3 priority, peripheral offline after update. No customer reply in 1 hour.",
  },
  1239: {
    rank: 9,
    reasoning:
      "P4 priority, standard workaround available. No SLA risk detected.",
  },
  1242: {
    rank: 10,
    reasoning:
      "P4 priority, intermittent issue with low business impact. No SLA risk.",
  },
};

const threadById = new Map(TEST_AGENT_THREADS.map((thread) => [thread.id, thread]));

export function getTestAgentThread(id) {
  return threadById.get(id);
}

export function sortThreadsByRanking(threadIds) {
  return [...threadIds].sort((a, b) => {
    const rankA = TEST_AGENT_RANKING[a]?.rank ?? Number.MAX_SAFE_INTEGER;
    const rankB = TEST_AGENT_RANKING[b]?.rank ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return threadIds.indexOf(a) - threadIds.indexOf(b);
  });
}

export function groupThreadIdsByTeam(threadIds, teamOrder, { sortByRanking = true } = {}) {
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
        threadIds: sortByRanking ? sortThreadsByRanking(ids) : ids,
      };
    })
    .filter((section) => section.threadIds.length > 0);
}
