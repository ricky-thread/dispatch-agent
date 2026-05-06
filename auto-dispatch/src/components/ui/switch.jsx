import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

const SWITCH_SIZES = {
  default: {
    root: "h-6 w-11",
    thumb:
      "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
  },
  sm: {
    root: "h-4 w-7",
    thumb:
      "h-3 w-3 data-[state=checked]:translate-x-3.5 data-[state=unchecked]:translate-x-0",
  },
};

export const Switch = React.forwardRef(function Switch(
  { className = "", size = "default", ...props },
  ref
) {
  const dim = SWITCH_SIZES[size] ?? SWITCH_SIZES.default;
  return (
    <SwitchPrimitives.Root
      ref={ref}
      className={[
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        dim.root,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-300",
        className,
      ].join(" ")}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={[
          "pointer-events-none block rounded-full bg-white shadow ring-0 transition-transform",
          dim.thumb,
        ].join(" ")}
      />
    </SwitchPrimitives.Root>
  );
});
