"use client";

import { useMemo, useState } from "react";
import { ratingLabels } from "@/data/questions";

export const useSlider = (initialValue: number | null = null) => {
  const [value, setValue] = useState<number | null>(initialValue);
  const activeLabel = useMemo(() => {
    if (value === null) return "Not Selected";
    return ratingLabels[value] ?? "Not Selected";
  }, [value]);

  return {
    value,
    setValue,
    activeLabel,
    labels: ratingLabels,
  };
};
