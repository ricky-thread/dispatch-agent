import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

const IMPORTANCE_GRADIENT = "linear-gradient(to right, #4f9d5d 0%, #ecc14f 55%, #e2705f 100%)";

export const Slider = React.forwardRef(function Slider(
  { className = "", gradient = false, ...props },
  ref
) {
  const amount = Math.max(1, props.value?.[0] ?? props.defaultValue?.[0] ?? 1);
  const max = props.max ?? 100;
  const min = props.min ?? 0;
  const fillPercent = Math.max(1, ((amount - min) / (max - min)) * 100);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={[
        "relative flex h-5 touch-none select-none items-center",
        className,
      ].join(" ")}
      {...props}
    >
      <SliderPrimitive.Track
        className={`relative grow overflow-hidden rounded-full ${
          gradient ? "h-1 bg-neutral-300" : "h-1.5 bg-neutral-200"
        }`}
      >
        <SliderPrimitive.Range
          className={`absolute h-full ${gradient ? "" : "bg-emerald-500"}`}
          style={
            gradient
              ? {
                  backgroundImage: IMPORTANCE_GRADIENT,
                  backgroundSize: `${10000 / fillPercent}% 100%`,
                  backgroundRepeat: "no-repeat",
                }
              : undefined
          }
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={`block rounded-full border-2 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-50 ${
          gradient ? "h-[14px] w-[14px] border-[#4fb596]" : "h-4 w-4 border-emerald-500"
        }`}
        aria-label="Value"
      />
    </SliderPrimitive.Root>
  );
});
