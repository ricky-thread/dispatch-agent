import { Frown, Meh, Smile, X } from "lucide-react";

function TeamsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <rect x="2" y="4" width="9" height="9" rx="1.5" fill="#5059C9" />
      <rect x="13" y="4" width="9" height="9" rx="1.5" fill="#7B83EB" />
      <rect x="2" y="15" width="9" height="6" rx="1.5" fill="#5059C9" />
      <rect x="13" y="15" width="9" height="6" rx="1.5" fill="#7B83EB" />
    </svg>
  );
}

const SLA_STYLES = {
  "On time": { stroke: "#10b981", textClass: "text-emerald-600" },
  "At risk": { stroke: "#f59e0b", textClass: "text-amber-600" },
  Breaching: { stroke: "#f97316", textClass: "text-orange-600" },
  Breached: { stroke: "#ef4444", textClass: "text-red-600" },
};

const SENTIMENT_ICONS = {
  positive: { Icon: Smile, className: "text-emerald-500" },
  neutral: { Icon: Meh, className: "text-neutral-400" },
  negative: { Icon: Frown, className: "text-red-500" },
};

const STATUS_BADGE_CLASS = "bg-blue-100 text-blue-800";

function SlaStatusIcon({ stroke }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0">
      <circle cx="6" cy="6" r="5" fill="none" stroke={stroke} strokeWidth="1.25" />
      <path d="M6 6V1A5 5 0 0 1 11 6H6Z" fill={stroke} />
    </svg>
  );
}

export function PersonAvatar({ initials, colorClass, size = "md" }) {
  const sizeClass =
    size === "sm"
      ? "h-4 w-4 text-[8px]"
      : size === "lg"
        ? "h-7 w-7 text-[10px]"
        : "h-5 w-5 text-[9px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${colorClass}`}
    >
      {initials}
    </span>
  );
}

export function ThreadCardBody({ thread, onRemove }) {
  const slaStyle = SLA_STYLES[thread.slaLabel] ?? SLA_STYLES["On time"];
  const sentimentConfig =
    SENTIMENT_ICONS[thread.sentiment] ?? SENTIMENT_ICONS.neutral;
  const SentimentIcon = sentimentConfig.Icon;

  return (
    <div className="relative px-3.5 py-3">
      {onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(thread.id)}
          className="absolute right-2.5 top-2.5 z-10 hidden h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 group-hover:flex"
          aria-label={`Remove ${thread.title}`}
        >
          <X size={14} />
        </button>
      ) : null}

      <div className="flex items-center justify-between gap-3 pr-5">
        <div className="flex min-w-0 items-center gap-2">
          <PersonAvatar
            initials={thread.contactInitials}
            colorClass={thread.contactColor}
          />
          <span className="truncate text-sm text-neutral-900">{thread.contact}</span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-500">
          <span className="truncate">{thread.company}</span>
          {thread.hasNotification ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-blue-500"
              title="Client replied — awaiting your response"
              aria-label="Client replied — awaiting your response"
            />
          ) : null}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2 pr-1">
        <TeamsIcon />
        <span className="min-w-0 flex-1 truncate text-sm text-neutral-800">
          {thread.title}
        </span>
        <span className="shrink-0 text-xs text-neutral-500">{thread.number}</span>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-xs text-neutral-500">
          {thread.message}
        </p>
        <span className="shrink-0 text-xs text-neutral-400">{thread.timestamp}</span>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${thread.typeColor}`}
          aria-hidden
        />
        <PersonAvatar
          initials={thread.assigneeInitials}
          colorClass={thread.assigneeColor}
          size="sm"
        />
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE_CLASS}`}
        >
          {thread.status}
        </span>
        <SentimentIcon
          size={13}
          className={`shrink-0 ${sentimentConfig.className}`}
          strokeWidth={1.75}
          aria-label={
            thread.sentiment
              ? `${thread.sentiment} client sentiment`
              : "Client sentiment"
          }
        />
        <span className={`flex items-center gap-1 text-[11px] ${slaStyle.textClass}`}>
          <SlaStatusIcon stroke={slaStyle.stroke} />
          {thread.slaLabel}
        </span>
      </div>
    </div>
  );
}

export default function ThreadCard({ thread, onRemove, ranking }) {
  return (
    <div className="group relative border-b border-neutral-200 bg-white last:border-b-0 hover:bg-neutral-50/50">
      {ranking ? (
        <div className="border-b border-teal-100 bg-teal-50 px-3.5 py-2 text-[13px] leading-snug text-teal-900">
          <span className="font-semibold">{ranking.rank}. </span>
          <span className="text-teal-800/65">
            {ranking.score}/{ranking.scoreMax ?? 100}
          </span>
          {ranking.reasoning ? ` — ${ranking.reasoning}.` : ""}
        </div>
      ) : null}

      <ThreadCardBody thread={thread} onRemove={onRemove} />
    </div>
  );
}
