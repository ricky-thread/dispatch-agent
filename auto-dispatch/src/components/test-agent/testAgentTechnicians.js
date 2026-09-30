import { sortThreadsByRanking } from "./testAgentThreads";

export const TEST_AGENT_TECHNICIANS = [
  {
    id: "tech-nathan",
    name: "Nathan Ozelim",
    initials: "NO",
    colorClass: "bg-sky-100 text-sky-800",
    teams: ["Team A - L1", "Team Charlie"],
    isAvailable: true,
    activeThreadCount: 1,
    isCalendarAvailable: true,
  },
  {
    id: "tech-andre",
    name: "Andre Queiroz",
    initials: "AQ",
    colorClass: "bg-orange-100 text-orange-800",
    teams: ["Team A", "Team Green"],
    isAvailable: false,
    activeThreadCount: 1,
    isCalendarAvailable: false,
  },
  {
    id: "tech-ismoil",
    name: "Ismoil GetthreadMember",
    initials: "IG",
    colorClass: "bg-neutral-800 text-white",
    teams: ["Team Charlie", "Team A"],
    isAvailable: true,
    activeThreadCount: 23,
    isCalendarAvailable: true,
  },
  {
    id: "tech-andrew",
    name: "Andrew Weston",
    initials: "AW",
    colorClass: "bg-emerald-100 text-emerald-800",
    teams: ["Team A", "Team A - L1"],
    isAvailable: true,
    activeThreadCount: 2,
    isCalendarAvailable: true,
  },
  {
    id: "tech-darren",
    name: "Darren Case",
    initials: "DC",
    colorClass: "bg-violet-100 text-violet-800",
    teams: ["Team A"],
    isAvailable: true,
    activeThreadCount: 3,
    isCalendarAvailable: true,
  },
  {
    id: "tech-mia",
    name: "Mia Lin",
    initials: "ML",
    colorClass: "bg-pink-100 text-pink-800",
    teams: ["Team A - L1", "Team Charlie"],
    isAvailable: false,
    activeThreadCount: 3,
    isCalendarAvailable: true,
  },
  {
    id: "tech-jordan",
    name: "Jordan Park",
    initials: "JP",
    colorClass: "bg-amber-100 text-amber-800",
    teams: ["Team Charlie"],
    isAvailable: false,
    activeThreadCount: 1,
    isCalendarAvailable: false,
  },
  {
    id: "tech-bobby",
    name: "Bobby Jacobs",
    initials: "BJ",
    colorClass: "bg-red-100 text-red-800",
    teams: ["Team Red"],
    isAvailable: true,
    activeThreadCount: 4,
    isCalendarAvailable: true,
  },
  {
    id: "tech-matt",
    name: "Matt Linn",
    initials: "ML",
    colorClass: "bg-blue-100 text-blue-800",
    teams: ["Team Blue"],
    isAvailable: true,
    activeThreadCount: 2,
    isCalendarAvailable: true,
  },
  {
    id: "tech-mark",
    name: "Mark Alayev",
    initials: "MA",
    colorClass: "bg-teal-100 text-teal-800",
    teams: ["Team A"],
    isAvailable: true,
    activeThreadCount: 5,
    isCalendarAvailable: true,
  },
  {
    id: "tech-kristof",
    name: "Kristof Orts",
    initials: "KO",
    colorClass: "bg-purple-100 text-purple-800",
    teams: ["Network Ops"],
    isAvailable: true,
    activeThreadCount: 0,
    isCalendarAvailable: true,
  },
];

function cloneTechnicians() {
  return TEST_AGENT_TECHNICIANS.map((tech) => ({ ...tech }));
}

function parseMaxActiveThreads(maxActiveThreads) {
  if (maxActiveThreads === "No limit" || maxActiveThreads == null) return null;
  const max = Number(maxActiveThreads);
  return Number.isFinite(max) ? max : null;
}

/** maxActiveThreads is a single value, or a { [team]: value } map when limits are set per Inbox Team. */
function resolveMaxForTech(tech, maxActiveThreads) {
  if (maxActiveThreads && typeof maxActiveThreads === "object") {
    const teamKey = tech.teams.find((team) => team in maxActiveThreads);
    return teamKey ? maxActiveThreads[teamKey] : "No limit";
  }
  return maxActiveThreads;
}

function isAtMaxCapacity(tech, maxActiveThreads) {
  const max = parseMaxActiveThreads(resolveMaxForTech(tech, maxActiveThreads));
  return max != null && tech.activeThreadCount >= max;
}

function isEligible(tech, { calendarAvailabilityEnabled, maxActiveThreads }) {
  if (calendarAvailabilityEnabled && !tech.isCalendarAvailable) return false;
  if (!tech.isAvailable) return false;
  if (isAtMaxCapacity(tech, maxActiveThreads)) return false;
  return true;
}

function pickBestTechnician(eligible) {
  return [...eligible].sort(
    (a, b) =>
      a.activeThreadCount - b.activeThreadCount ||
      b.availableHoursToday - a.availableHoursToday
  )[0];
}

export function formatTechnicianSummary(tech) {
  const hours = tech.availableHoursToday ?? 0;
  const hourLabel = hours === 1 ? "1h" : `${hours}h`;
  const threadLabel =
    tech.activeThreadCount === 1
      ? "1 active thread assigned."
      : `${tech.activeThreadCount} active threads assigned.`;
  return `${hourLabel} available today. ${threadLabel}`;
}

export function formatWorkloadLabel(tech, reason) {
  const count = tech.activeThreadCount;
  const threadWord = count === 1 ? "thread" : "threads";
  if (reason === "at_capacity") {
    return `Working ${count} ${threadWord}, at max capacity`;
  }
  return `Working ${count} ${threadWord}`;
}

/**
 * Build eligible / not-eligible dispatch order for Auto-assign test run.
 * Only techs on configured teams (and not excluded) are considered.
 */
export function computeDispatchEligibility(options = {}) {
  const {
    configuredTeams = [],
    excludeTechs = [],
    maxActiveThreads = "No limit",
  } = options;

  const excluded = new Set(excludeTechs);
  const teamSet = new Set(configuredTeams);

  const candidates = TEST_AGENT_TECHNICIANS.filter((tech) => {
    if (excluded.has(tech.name)) return false;
    if (teamSet.size === 0) return true;
    return tech.teams.some((team) => teamSet.has(team));
  }).map((tech) => {
    const displayTeams =
      teamSet.size === 0
        ? tech.teams
        : tech.teams.filter((team) => teamSet.has(team));
    const atCapacity = isAtMaxCapacity(tech, maxActiveThreads);
    const reason = atCapacity
      ? "at_capacity"
      : !tech.isAvailable
        ? "unavailable"
        : null;
    const eligible = reason == null;

    return {
      ...tech,
      displayTeams: displayTeams.length > 0 ? displayTeams : tech.teams,
      eligible,
      reason,
      statusLabel: eligible ? "Available" : "Unavailable",
      workloadLabel: formatWorkloadLabel(tech, reason),
    };
  });

  const eligible = candidates
    .filter((tech) => tech.eligible)
    .sort(
      (a, b) =>
        a.activeThreadCount - b.activeThreadCount || a.name.localeCompare(b.name)
    )
    .map((tech, index) => ({ ...tech, rank: index + 1 }));

  const notEligible = candidates
    .filter((tech) => !tech.eligible)
    .sort((a, b) => {
      if (a.reason !== b.reason) {
        if (a.reason === "unavailable") return -1;
        if (b.reason === "unavailable") return 1;
      }
      return b.activeThreadCount - a.activeThreadCount || a.name.localeCompare(b.name);
    });

  return { eligible, notEligible };
}

/** Legacy: thread → technician recommendations (kept for compatibility). */
export function computeTechnicianRecommendations(threadIds, options = {}) {
  const {
    maxActiveThreads = "No limit",
    calendarAvailabilityEnabled = false,
    rankingSignals = [],
  } = options;

  if (!threadIds.length) return [];

  const orderedIds = sortThreadsByRanking(threadIds, rankingSignals);
  const techs = cloneTechnicians();

  return orderedIds.map((threadId) => {
    const eligible = techs.filter((tech) =>
      isEligible(tech, { calendarAvailabilityEnabled, maxActiveThreads })
    );

    if (eligible.length === 0) {
      return { threadId, technician: null };
    }

    const picked = pickBestTechnician(eligible);
    const techIndex = techs.findIndex((tech) => tech.id === picked.id);
    techs[techIndex] = {
      ...techs[techIndex],
      activeThreadCount: techs[techIndex].activeThreadCount + 1,
    };

    return {
      threadId,
      technician: { ...picked },
    };
  });
}
