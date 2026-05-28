import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

const SWITCH_SIZES = {
  default: {
    root: "h-6 w-11",
    thumb: "h-5 w-5 top-0.5",
  },
  sm: {
    root: "h-5 w-9",
    thumb: "h-4 w-4 top-0.5",
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
        "relative inline-block shrink-0 cursor-pointer appearance-none rounded-full border-0 p-0",
        dim.root,
        "transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-300",
        className,
      ].join(" ")}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={[
          "pointer-events-none absolute rounded-full bg-white shadow-sm ring-0",
          dim.thumb,
          "left-0.5 right-auto",
          "data-[state=checked]:left-auto data-[state=checked]:right-0.5",
          "data-[state=unchecked]:left-0.5 data-[state=unchecked]:right-auto",
          "transition-[left,right] duration-100 ease-in-out",
        ].join(" ")}
      />
    </SwitchPrimitives.Root>
  );
});
