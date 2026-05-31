import { ArrowUpRight, Info } from "lucide-react";
import { PersonAvatar, ThreadCardBody } from "../ThreadCard";
import { formatTechnicianSummary } from "./testAgentTechnicians";

function UnavailableBanner({ fallbackStatus }) {
  return (
    <div className="flex gap-2.5 border-b border-sky-100 bg-sky-50 px-3.5 py-3">
      <Info size={16} className="mt-0.5 shrink-0 text-sky-600" aria-hidden />
      <p className="text-[13px] leading-snug text-sky-900">
        All technicians are at capacity. This ticket will be moved to{" "}
        <span className="font-medium">{fallbackStatus}</span> and will need to be
        assigned manually.{" "}
        <a
          href="#"
          className="inline-flex items-center gap-0.5 font-medium text-emerald-600 hover:text-emerald-700"
          onClick={(event) => event.preventDefault()}
        >
          Set up a Flow
          <ArrowUpRight size={12} strokeWidth={2.25} aria-hidden />
        </a>{" "}
        to automatically notify the client while they wait.
      </p>
    </div>
  );
}

function TechnicianHeader({ technician }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-teal-100 bg-teal-50 px-3.5 py-2.5">
      <PersonAvatar
        initials={technician.initials}
        colorClass={technician.colorClass}
        size="lg"
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-neutral-900">
          {technician.name}
        </div>
        <div className="truncate text-xs text-neutral-600">
          {formatTechnicianSummary(technician)}
        </div>
      </div>
    </div>
  );
}

export default function RecommendationCard({
  thread,
  recommendation,
  fallbackStatus = "Escalation",
  onRemove,
}) {
  return (
    <div className="group relative border-b border-neutral-200 bg-white last:border-b-0 hover:bg-neutral-50/50">
      {recommendation?.technician ? (
        <TechnicianHeader technician={recommendation.technician} />
      ) : (
        <UnavailableBanner fallbackStatus={fallbackStatus} />
      )}
      <ThreadCardBody thread={thread} onRemove={onRemove} />
    </div>
  );
}
