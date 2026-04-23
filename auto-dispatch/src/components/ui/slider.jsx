import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

export const Slider = React.forwardRef(function Slider(
  { className = "", ...props },
  ref
) {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={[
        "relative flex h-5 touch-none select-none items-center",
        className,
      ].join(" ")}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-neutral-200">
        <SliderPrimitive.Range className="absolute h-full bg-emerald-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block h-4 w-4 rounded-full border-2 border-emerald-500 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-50"
        aria-label="Value"
      />
    </SliderPrimitive.Root>
  );
});
