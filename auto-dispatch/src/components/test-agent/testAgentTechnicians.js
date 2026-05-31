import { sortThreadsByRanking } from "./testAgentThreads";

export const TEST_AGENT_TECHNICIANS = [
  {
    id: "tech-1",
    name: "Andrew Weston",
    initials: "AW",
    colorClass: "bg-emerald-100 text-emerald-800",
    availableHoursToday: 3,
    activeThreadCount: 2,
    isCalendarAvailable: true,
  },
  {
    id: "tech-2",
    name: "Darren Case",
    initials: "DC",
    colorClass: "bg-sky-100 text-sky-800",
    availableHoursToday: 2,
    activeThreadCount: 3,
    isCalendarAvailable: true,
  },
  {
    id: "tech-3",
    name: "Mia Lin",
    initials: "ML",
    colorClass: "bg-violet-100 text-violet-800",
    availableHoursToday: 1,
    activeThreadCount: 3,
    isCalendarAvailable: true,
  },
  {
    id: "tech-4",
    name: "Jordan Park",
    initials: "JP",
    colorClass: "bg-amber-100 text-amber-800",
    availableHoursToday: 0,
    activeThreadCount: 1,
    isCalendarAvailable: false,
  },
];

function cloneTechnicians() {
  return TEST_AGENT_TECHNICIANS.map((tech) => ({ ...tech }));
}

function isEligible(tech, { calendarAvailabilityEnabled, maxActiveThreads }) {
  if (calendarAvailabilityEnabled && !tech.isCalendarAvailable) return false;
  if (maxActiveThreads !== "No limit") {
    const max = Number(maxActiveThreads);
    if (Number.isFinite(max) && tech.activeThreadCount >= max) return false;
  }
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
  const hours = tech.availableHoursToday;
  const hourLabel = hours === 1 ? "1h" : `${hours}h`;
  const threadLabel =
    tech.activeThreadCount === 1
      ? "1 active thread assigned."
      : `${tech.activeThreadCount} active threads assigned.`;
  return `${hourLabel} available today. ${threadLabel}`;
}

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
