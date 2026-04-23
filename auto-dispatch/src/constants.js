// -----------------------------------------------------------------------------
// Mock data for the Auto-Dispatch prototype.
// In production, these would come from the backend / current workspace.
// -----------------------------------------------------------------------------

export const BOARDS = [
  "Boardsmoil",
  "Help Desk",
  "Integration",
  "Network Ops",
  "Onboarding",
  "Procurement",
  "Professional Services",
  "Projects-2-10",
  "Projects-2-13",
  "Projects-2-14",
  "Projects-2-15",
  "T0 Triage",
  "T1 Service Desk",
  "T2 Security",
  "T2 Sys Admin",
  "Triage",
];

export const TEAMS = [
  "Team Red",
  "Team Blue",
  "Team Green",
  "Network Ops",
  "Procurement",
];

export const STATUSES = [
  ">CANCELLED",
  ">CLOSED",
  ">COMPLETED (QA)",
  "ACKNOWLEDGED",
  "ASSIGNED",
  "ASSIGNED (RESPONDED)",
  "CLOSED",
  "CLOSED (RESOLVED)",
  "COMPLETED",
  "ESCALATE (NEEDS IMMEDIATE ATTENTION)",
  "IN PROGRESS",
  "IN PROGRESS (PLAN OF ACTION)",
  "IN TRIAGE",
  "NEEDS IMMEDIATE ATTENTION",
  "NEW",
  "NEW (NOT RESPONDED)",
  "ON HOLD",
  "ON-HOLD",
  "OPEN",
  "READY",
  "RE-OPENED",
  "REQUIRES SCHEDULING",
  "SCHEDULED",
  "TRIAGE",
  "UNASSIGNED",
  "WAITING CLIENT APPROVAL",
  "WAITING CLIENT RESPONSE",
  "WAITING ON US",
  "WAITING VENDOR",
];

export const ROUTE_CONDITION_FIELDS = [
  "Company",
  "Company type",
  "Type",
  "Subtype",
  "Item",
  "Agreement",
];

export const ROUTE_FILTER_DATA = {
  companies: [
    { id: "comp-acme", name: "Acme Manufacturing", status: "active", region: "US-East" },
    { id: "comp-northstar", name: "Northstar Health", status: "active", region: "US-West" },
    { id: "comp-oceanic", name: "Oceanic Logistics", status: "active", region: "EMEA" },
    { id: "comp-redwood", name: "Redwood Legal Group", status: "paused", region: "US-Central" },
    { id: "comp-summit", name: "Summit Retail", status: "active", region: "APAC" },
    { id: "comp-brightline", name: "Brightline Schools", status: "trial", region: "US-East" },
    { id: "comp-zenith", name: "Zenith Finance", status: "active", region: "EMEA" },
    { id: "comp-harbor", name: "Harbor Hospitality", status: "active", region: "US-West" },
  ],
  agreements: [
    {
      id: "agr-msp-standard",
      name: "MSP Standard",
      companyId: "comp-acme",
      term: "12-month",
      sla: "Business Hours",
    },
    {
      id: "agr-msp-premium",
      name: "MSP Premium",
      companyId: "comp-northstar",
      term: "24-month",
      sla: "24x7",
    },
    {
      id: "agr-project-rollout",
      name: "Project Rollout",
      companyId: "comp-oceanic",
      term: "6-month",
      sla: "Business Hours",
    },
    {
      id: "agr-security-plus",
      name: "Security Plus",
      companyId: "comp-zenith",
      term: "12-month",
      sla: "24x7",
    },
    {
      id: "agr-co-managed-it",
      name: "Co-Managed IT",
      companyId: "comp-harbor",
      term: "12-month",
      sla: "Extended Hours",
    },
    {
      id: "agr-helpdesk-basic",
      name: "Helpdesk Basic",
      companyId: "comp-summit",
      term: "12-month",
      sla: "Business Hours",
    },
  ],
  types: [
    { id: "type-incident", name: "Incident" },
    { id: "type-service-request", name: "Service Request" },
    { id: "type-problem", name: "Problem" },
    { id: "type-change", name: "Change" },
    { id: "type-project-task", name: "Project Task" },
    { id: "type-maintenance", name: "Maintenance" },
  ],
  subtypes: [
    { id: "sub-email", name: "Email", typeId: "type-incident" },
    { id: "sub-network", name: "Network", typeId: "type-incident" },
    { id: "sub-hardware", name: "Hardware", typeId: "type-incident" },
    { id: "sub-access", name: "Access Request", typeId: "type-service-request" },
    { id: "sub-software-install", name: "Software Install", typeId: "type-service-request" },
    { id: "sub-password-reset", name: "Password Reset", typeId: "type-service-request" },
    { id: "sub-root-cause", name: "Root Cause Analysis", typeId: "type-problem" },
    { id: "sub-standard-change", name: "Standard Change", typeId: "type-change" },
    { id: "sub-emergency-change", name: "Emergency Change", typeId: "type-change" },
    { id: "sub-onboarding", name: "User Onboarding", typeId: "type-project-task" },
    { id: "sub-offboarding", name: "User Offboarding", typeId: "type-project-task" },
    { id: "sub-patching", name: "OS Patching", typeId: "type-maintenance" },
  ],
  items: [
    {
      id: "item-1001",
      title: "VPN disconnects every 30 minutes",
      companyId: "comp-oceanic",
      agreementId: "agr-project-rollout",
      typeId: "type-incident",
      subtypeId: "sub-network",
      priority: "high",
      status: "open",
    },
    {
      id: "item-1002",
      title: "New user onboarding for Sales team",
      companyId: "comp-summit",
      agreementId: "agr-helpdesk-basic",
      typeId: "type-project-task",
      subtypeId: "sub-onboarding",
      priority: "medium",
      status: "in_progress",
    },
    {
      id: "item-1003",
      title: "Install Adobe Creative Cloud",
      companyId: "comp-brightline",
      agreementId: "agr-helpdesk-basic",
      typeId: "type-service-request",
      subtypeId: "sub-software-install",
      priority: "low",
      status: "open",
    },
    {
      id: "item-1004",
      title: "Investigate recurring SQL timeout",
      companyId: "comp-zenith",
      agreementId: "agr-security-plus",
      typeId: "type-problem",
      subtypeId: "sub-root-cause",
      priority: "critical",
      status: "in_progress",
    },
    {
      id: "item-1005",
      title: "Quarterly workstation patch cycle",
      companyId: "comp-acme",
      agreementId: "agr-msp-standard",
      typeId: "type-maintenance",
      subtypeId: "sub-patching",
      priority: "medium",
      status: "scheduled",
    },
    {
      id: "item-1006",
      title: "Reset MFA for executive account",
      companyId: "comp-northstar",
      agreementId: "agr-msp-premium",
      typeId: "type-service-request",
      subtypeId: "sub-password-reset",
      priority: "high",
      status: "open",
    },
    {
      id: "item-1007",
      title: "Emergency firewall rule update",
      companyId: "comp-harbor",
      agreementId: "agr-co-managed-it",
      typeId: "type-change",
      subtypeId: "sub-emergency-change",
      priority: "critical",
      status: "approved",
    },
    {
      id: "item-1008",
      title: "Laptop replacement for legal counsel",
      companyId: "comp-redwood",
      agreementId: "agr-msp-standard",
      typeId: "type-incident",
      subtypeId: "sub-hardware",
      priority: "medium",
      status: "waiting_customer",
    },
    {
      id: "item-1009",
      title: "Exchange mailbox access request",
      companyId: "comp-acme",
      agreementId: "agr-msp-standard",
      typeId: "type-service-request",
      subtypeId: "sub-access",
      priority: "low",
      status: "open",
    },
    {
      id: "item-1010",
      title: "Office Wi-Fi intermittent packet loss",
      companyId: "comp-summit",
      agreementId: "agr-helpdesk-basic",
      typeId: "type-incident",
      subtypeId: "sub-network",
      priority: "high",
      status: "in_progress",
    },
  ],
};

export const ROUTE_CONDITION_VALUES = {
  Company: ROUTE_FILTER_DATA.companies.map((company) => company.name).sort((a, b) =>
    a.localeCompare(b)
  ),
  // We don't yet have a dedicated company-type field in this dataset,
  // so we use company status as a stand-in for the prototype filter.
  "Company type": Array.from(
    new Set(ROUTE_FILTER_DATA.companies.map((company) => company.status))
  )
    .map((status) => status.replace(/_/g, " "))
    .map((status) => status.charAt(0).toUpperCase() + status.slice(1))
    .sort((a, b) => a.localeCompare(b)),
  Type: ROUTE_FILTER_DATA.types.map((type) => type.name).sort((a, b) => a.localeCompare(b)),
  Subtype: ROUTE_FILTER_DATA.subtypes
    .map((subtype) => subtype.name)
    .sort((a, b) => a.localeCompare(b)),
  Item: ROUTE_FILTER_DATA.items.map((item) => item.title).sort((a, b) => a.localeCompare(b)),
  Agreement: ROUTE_FILTER_DATA.agreements
    .map((agreement) => agreement.name)
    .sort((a, b) => a.localeCompare(b)),
};

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
