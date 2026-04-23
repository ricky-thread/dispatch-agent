// -----------------------------------------------------------------------------
// Mock data for the Auto-Dispatch prototype.
// In production, these would come from the backend / current workspace.
// -----------------------------------------------------------------------------

export const BOARDS = [
  "Help Desk",
  "Triage",
  "Network Ops",
  "Procurement",
  "Onboarding",
];

export const TEAMS = [
  "Team Red",
  "Team Blue",
  "Team Green",
  "Network Ops",
  "Procurement",
];

export const STATUSES = [
  "New",
  "Needs scheduling",
  "Open",
  "Waiting on client",
  "Resolved",
];

// Generate every :00 and :30 from 12:00 AM to 11:30 PM
function generateHourOptions() {
  const out = [];
  for (let h = 0; h < 24; h++) {
    const period = h < 12 ? "AM" : "PM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    out.push(`${displayHour}:00 ${period}`);
    out.push(`${displayHour}:30 ${period}`);
  }
  return out;
}

export const HOUR_OPTIONS = generateHourOptions();

// Color the team circle by team name (cosmetic only)
export const TEAM_COLORS = {
  "Team Red": "bg-red-500",
  "Team Blue": "bg-blue-500",
  "Team Green": "bg-emerald-500",
  "Network Ops": "bg-purple-500",
  Procurement: "bg-amber-500",
};
