import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function TooltipProvider({ children, delayDuration = 400, ...props }) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} {...props}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export function Tooltip({ children, ...props }) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>;
}

export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef(function TooltipContent(
  { className = "", sideOffset = 6, ...props },
  ref
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={[
          "z-[300] max-w-xs rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs leading-snug text-neutral-50 shadow-lg",
          "select-none",
          className,
        ].join(" ")}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
