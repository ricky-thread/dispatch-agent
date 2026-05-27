import { TEAM_META } from "../constants";

export default function TeamIcon({ team, className = "" }) {
  const meta = TEAM_META[team];
  if (!meta?.emoji) return null;
  return (
    <span
      className={`shrink-0 text-sm leading-none ${className}`.trim()}
      aria-hidden
    >
      {meta.emoji}
    </span>
  );
}

export function TeamLabel({ team, className = "" }) {
  if (!team) return null;
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`.trim()}>
      <TeamIcon team={team} />
      <span className="truncate text-sm font-medium text-neutral-900">{team}</span>
    </span>
  );
}
