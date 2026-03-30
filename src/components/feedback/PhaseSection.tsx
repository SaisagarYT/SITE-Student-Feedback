"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import clsx from "clsx";
import QuestionCard from "@/components/feedback/QuestionCard";
import type { FeedbackPhase } from "@/data/questions";

type PhaseSectionProps = {
  phase: FeedbackPhase;
  ratings: Record<string, number>;
  remark: string;
  onRatingChange: (questionId: string, value: number) => void;
  onRemarkChange: (value: string) => void;
  disabled?: boolean;
};

const PhaseSection = ({
  phase,
  ratings,
  remark,
  onRatingChange,
  onRemarkChange,
  disabled = false,
}: PhaseSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textAreaWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!sectionRef.current) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-question-card]",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: "power2.out",
          delay: 0.12,
        }
      );
    }, sectionRef);

    return () => context.revert();
  }, []);

  const completedCount = Object.keys(ratings).length;

  return (
    <section
      ref={sectionRef}
      data-reveal
      data-phase={phase.id}
      className="rounded-[2rem] border border-[rgba(255,255,255,0.16)] bg-[rgba(250,253,252,0.98)] p-4 shadow-[0_28px_75px_rgba(8,80,77,0.22)] sm:p-8"
    >
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--brand-deep)] uppercase">{phase.title}</p>
          <h2 className="text-lg font-medium text-[var(--ink)] sm:text-2xl">{phase.subtitle}</h2>
          <p className="text-sm text-[var(--muted)]">{phase.helperText}</p>
        </div>

        <div className="rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-right">
          <p className="text-[10px] tracking-[0.15em] text-[var(--muted)] uppercase sm:text-xs">Completion</p>
          <p className="text-sm font-medium text-[var(--ink)] sm:text-base">
            {completedCount}/{phase.questions.length}
          </p>
          <p className="text-[10px] text-[var(--muted)] sm:text-xs">{remark.trim() ? "Remark added" : "Remark pending"}</p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {phase.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            questionId={question.id}
            questionNumber={index + 1}
            questionText={question.text}
            reverseScored={question.reverseScored}
            value={ratings[question.id]}
            onRatingChange={(nextValue) => {
              onRatingChange(question.id, nextValue);
            }}
            disabled={disabled}
          />
        ))}
      </div>

      <div ref={textAreaWrapRef} className="mt-6 rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface-soft)] p-4 sm:mt-8 sm:p-5">
        <label htmlFor={`${phase.id}_remark`} className="mb-3 block text-sm text-[var(--ink)] sm:text-base">
          {phase.textareaPrompt}
        </label>

        <textarea
          id={`${phase.id}_remark`}
          rows={4}
          placeholder="Write your response here..."
          value={remark}
          onChange={(event) => onRemarkChange(event.target.value)}
          className={clsx(
            "w-full resize-y rounded-[1.15rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition duration-300",
            "placeholder:text-[var(--muted)]/70 focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_rgba(10,152,146,0.12)]",
            disabled && "opacity-60 cursor-not-allowed bg-gray-100"
          )}
          onFocus={() => {
            if (!textAreaWrapRef.current || disabled) return;
            gsap.to(textAreaWrapRef.current, {
              borderColor: "var(--brand)",
              boxShadow: "0 0 0 3px rgba(10,152,146,0.1)",
              duration: 0.25,
              ease: "power2.out",
            });
          }}
          onBlur={() => {
            if (!textAreaWrapRef.current || disabled) return;
            gsap.to(textAreaWrapRef.current, {
              borderColor: "var(--line)",
              boxShadow: "none",
              duration: 0.25,
              ease: "power2.out",
            });
          }}
          disabled={disabled}
        />
      </div>

    </section>
  );
};

export default PhaseSection;
// random comment