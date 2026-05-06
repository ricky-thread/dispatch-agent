import { useEffect, useRef, useState } from "react";

/**
 * Compact multi-select tailored to the Flows page. Mirrors the visual system
 * of the surrounding `.select` controls so it slots into the trigger card
 * without re-skinning anything.
 *
 * - `values`     : currently selected option strings
 * - `options`    : full list of available options
 * - `onChange`   : called with the next array of selected values
 * - `placeholder`: shown when nothing is selected
 */
export default function FlowsMultiSelect({
  values = [],
  options = [],
  onChange,
  placeholder = "Select",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handle = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const toggle = (opt) => {
    if (!onChange) return;
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  };

  const isEmpty = values.length === 0;
  const label = isEmpty
    ? placeholder
    : values.length === 1
      ? values[0]
      : `${values[0]} +${values.length - 1}`;

  return (
    <div className="multi-select" ref={rootRef}>
      <button
        type="button"
        className={`select multi-select-trigger${isEmpty ? " is-empty" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div className="multi-select-panel" role="listbox">
          {options.map((opt) => {
            const selected = values.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                className="multi-select-option"
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggle(opt);
                }}
              >
                <span
                  className={`multi-select-check${selected ? " is-checked" : ""}`}
                  aria-hidden="true"
                >
                  {selected && (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
