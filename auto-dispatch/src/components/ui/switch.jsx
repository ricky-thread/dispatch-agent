import * as React from "react";

export function Switch({ checked = false, onCheckedChange, className = "" }) {
  const handleToggle = () => onCheckedChange?.(!checked);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onClick={handleToggle}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        "bg-neutral-300 data-[state=checked]:bg-emerald-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}
