"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import clsx from "clsx";
import { Icon } from "@iconify/react";
import SliderRating from "@/components/feedback/SliderRating";

type QuestionCardProps = {
  questionNumber: number;
  questionText: string;
  questionId: string;
  reverseScored?: boolean;
  value?: number;
  onRatingChange?: (value: number) => void;
  disabled?: boolean;
};

const QuestionCard = ({
  questionNumber,
  questionText,
  questionId,
  reverseScored,
  value,
  onRatingChange,
  disabled = false,
}: QuestionCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    const enter = () => {
      gsap.to(cardElement, {
        y: -6,
        borderColor: "#0a9892",
        boxShadow: "0 22px 48px rgba(9, 93, 104, 0.14), 0 0 0 3px rgba(10, 152, 146, 0.08)",
        duration: 0.28,
        ease: "power2.out",
      });
    };

    const leave = () => {
      gsap.to(cardElement, {
        y: 0,
        borderColor: "#d0e3df",
        boxShadow: "0 14px 34px rgba(9, 93, 104, 0.08)",
        duration: 0.28,
        ease: "power2.out",
      });
    };

    cardElement.addEventListener("mouseenter", enter);
    cardElement.addEventListener("mouseleave", leave);

    return () => {
      cardElement.removeEventListener("mouseenter", enter);
      cardElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <article
      ref={cardRef}
      data-question-card
      className="question-card rounded-[1.6rem] border border-[var(--line)] bg-white p-5 shadow-[0_14px_34px_rgba(9,93,104,0.08)] sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-[var(--brand-deep)] uppercase sm:text-xs">
            Question {questionNumber}
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink)] sm:text-base">{questionText}</p>
        </div>

        <span
          className={clsx(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide sm:text-xs",
            reverseScored
              ? "border-[rgba(239,42,113,0.18)] bg-[rgba(239,42,113,0.08)] text-[var(--accent-deep)]"
              : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--brand-deep)]"
          )}
        >
          <Icon icon="material-symbols:keyboard-double-arrow-right" className="text-base" />
          {reverseScored ? "Reverse Scored" : "Standard"}
        </span>
      </div>

      <SliderRating id={questionId} value={value} onChange={onRatingChange} disabled={disabled} />
    </article>
  );
};

export default QuestionCard;
