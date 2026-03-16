"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import clsx from "clsx";
import { useSlider } from "@/hooks/useSlider";
import { Icon } from "@iconify/react";

type SliderRatingProps = {
  id: string;
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


const SliderRating = ({ id, onChange, disabled = false }: SliderRatingProps) => {
  const { value, setValue, activeLabel } = useSlider(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(null);
  }, [setValue]);

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
        <div
          ref={activeRef}
          className={clsx(
            "inline-flex rounded-full border px-3 py-1 text-[10px] font-medium tracking-[0.16em] uppercase shadow-[0_10px_22px_rgba(10,152,146,0.12)] sm:text-xs",
            value === null
              ? "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)]"
              : "border-[var(--brand)] bg-[rgba(10,152,146,0.12)] text-[var(--brand-deep)]"
          )}
        >
          Selected: {activeLabel}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {labelEntries.map((entry) => (
          <label
            key={entry.value}
            className={clsx(
              "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-[11px] transition duration-300 sm:text-xs",
              value === entry.value
                ? "border-[var(--brand)] bg-[rgba(10,152,146,0.1)] text-[var(--ink)] shadow-[0_0_0_1px_rgba(10,152,146,0.16),0_16px_32px_rgba(10,152,146,0.1)]"
                : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--ink)]"
            )}
          >
            <div className="flex items-center gap-2">
              <input
                id={`${id}_${entry.value}`}
                type="checkbox"
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
                value === entry.value ? "text-[var(--brand-deep)]" : "text-[var(--muted)]",
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
