"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import clsx from "clsx";
import { useSlider } from "@/hooks/useSlider";
import { Icon } from "@iconify/react";

type SliderRatingProps = {
  id: string;
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
};

const labelEntries = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
] as const;


const SliderRating = ({ id, value: propValue, onChange, disabled = false }: SliderRatingProps) => {
  const { value, setValue, activeLabel } = useSlider(propValue ?? null);
  const controlRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(propValue ?? null);
  }, [setValue, propValue]);

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
  }, [value]);

  const handleChange = (nextValue: number) => {
    if (disabled) return;
    setValue(nextValue);
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
                ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-[0_0_0_2px_rgba(10,152,146,0.18),0_16px_32px_rgba(10,152,146,0.12)]"
                : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--ink)]"
            )}
          >
            <div className="flex items-center gap-2">
              <input
                id={`${id}_${entry.value}`}
                type="radio"
                name={id}
                checked={value === entry.value}
                onChange={() => handleChange(entry.value)}
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
                value === entry.value ? "text-white" : "text-[var(--muted)]",
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
