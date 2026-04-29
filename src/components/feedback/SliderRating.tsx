"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import clsx from "clsx";
import { Icon } from "@iconify/react";

type SliderRatingProps = {
  id: string;
  value?: number;
  onChange?: (value: number) => void;
  onTabForward?: (value: number) => void;
  disabled?: boolean;
};

const labelEntries = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
] as const;


const SliderRating = ({ id, value: propValue, onChange, onTabForward, disabled = false }: SliderRatingProps) => {
  const value = propValue ?? null;
  const activeLabel = value === null ? "Not Selected" : (labelEntries.find(e => e.value === value)?.label ?? "Not Selected");
  const controlRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!controlRef.current) return;

    gsap.fromTo(
      controlRef.current,
      { scale: 0.995 },
      { scale: 1, duration: 0.25, ease: "power2.out" }
    );

    if (activeRef.current) {
      gsap.fromTo(
        activeRef.current,
        { y: 8, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.24, ease: "power2.out"}
      );
    }
  }, [propValue]);

  const handleChange = (nextValue: number) => {
    if (disabled) return;
    onChange?.(nextValue);
  };

  return (
    <div ref={controlRef} className="space-y-6">
      <div className="relative">
        {/* Removed Selected: {activeLabel} display as requested */}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {labelEntries.map((entry) => (
          <label
            key={entry.value}
            className={clsx(
              "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-[11px] transition duration-300 sm:text-xs",
              value === entry.value
                ? "border-(--brand) bg-(--brand) text-white shadow-[0_0_0_2px_rgba(10,152,146,0.18),0_16px_32px_rgba(10,152,146,0.12)]"
                : "border-(--line) bg-(--surface-soft) text-(--muted) hover:border-(--brand) hover:text-(--ink)"
            )}
          >
            <div className="flex items-center gap-2">
              <input
                id={`${id}_${entry.value}`}
                type="radio"
                name={id}
                checked={value === entry.value}
                onChange={() => handleChange(entry.value)}
                onKeyDown={(event) => {
                  if (disabled) return;
                  if (event.key !== "Tab" || event.shiftKey) return;
                  if (value !== entry.value) return;
                  onTabForward?.(entry.value);
                }}
                className="sr-only"
                aria-label={entry.label}
                disabled={disabled}
              />
              <span className="font-medium">{entry.value}.</span>
              <span>{entry.label}</span>
            </div>
            <Icon
              icon={value === entry.value ? "material-symbols:check-circle-outline" : "material-symbols:radio-button-unchecked"}
              className={clsx(
                "text-base",
                value === entry.value ? "text-white" : "text-(--muted)",
                disabled && "opacity-50"
              )}
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default SliderRating;
