import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

export const Switch = React.forwardRef(function Switch(
  { className = "", ...props },
  ref
) {
  return (
    <SwitchPrimitives.Root
      ref={ref}
      className={[
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-300",
        className,
      ].join(" ")}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={[
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        ].join(" ")}
      />
    </SwitchPrimitives.Root>
  );
});
