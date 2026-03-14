"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Icon } from "@iconify/react";
import FeedbackHeader from "@/components/feedback/FeedbackHeader";
import PhaseSection from "@/components/feedback/PhaseSection";
import { feedbackPhases } from "@/data/questions";

type PhaseProgressState = {
  ratings: Record<string, number>;
  remark: string;
};

export default function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const phaseContainerRef = useRef<HTMLDivElement>(null);
  const [phaseState, setPhaseState] = useState<Record<"phase1" | "phase2", PhaseProgressState>>({
    phase1: { ratings: {}, remark: "" },
    phase2: { ratings: {}, remark: "" },
  });
  const [activePhase, setActivePhase] = useState<"phase1" | "phase2">("phase1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Move all variable and hook declarations above the return statement ---
  const phase1 = feedbackPhases.find((phase) => phase.id === "phase1") ?? feedbackPhases[0];
  const phase2 = feedbackPhases.find((phase) => phase.id === "phase2") ?? feedbackPhases[1] ?? feedbackPhases[0];
  const phase1QuestionCount = phase1.questions.length;
  const phase2QuestionCount = phase2.questions.length;
  const phase1Complete =
    Object.keys(phaseState.phase1.ratings).length === phase1QuestionCount &&
    phaseState.phase1.remark.trim().length > 0;
  const phase2Complete =
    Object.keys(phaseState.phase2.ratings).length === phase2QuestionCount &&
    phaseState.phase2.remark.trim().length > 0;
  const activePhaseConfig = activePhase === "phase1" ? phase1 : phase2;
  const activePhaseState = phaseState[activePhase];
  const activePhaseComplete = activePhase === "phase1" ? phase1Complete : phase2Complete;
  const activeQuestionCount = activePhaseConfig.questions.length;
  const activePhaseTotalTasks = activeQuestionCount + 1;
  const activePhaseCompletedTasks =
    Object.keys(activePhaseState.ratings).length +
    (activePhaseState.remark.trim() ? 1 : 0);
  const progressPercent = useMemo(
    () => Math.round((activePhaseCompletedTasks / activePhaseTotalTasks) * 100),
    [activePhaseCompletedTasks, activePhaseTotalTasks]
  );
  const switchPhase = (nextPhase: "phase1" | "phase2") => {
    if (!phaseContainerRef.current || nextPhase === activePhase) {
      setActivePhase(nextPhase);
      return;
    }
    const current = phaseContainerRef.current;
    gsap.to(current, {
      autoAlpha: 0,
      y: -18,
      duration: 0.24,
      ease: "power2.in",
      onComplete: () => {
        setActivePhase(nextPhase);
        requestAnimationFrame(() => {
          if (!phaseContainerRef.current) return;
          gsap.fromTo(
            phaseContainerRef.current,
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.42, ease: "power3.out" }
          );
        });
      },
    });
  };
  const handleSubmit = () => {
    if (!activePhaseComplete) return;
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      window.alert(
        activePhase === "phase1"
          ? "Phase 1 feedback submitted successfully."
          : "Phase 2 feedback submitted successfully."
      );
    }, 700);
  };
  useLayoutEffect(() => {
    if (!pageRef.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-reveal]",
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.14,
          ease: "power3.out",
        }
      );
    }, pageRef);
    return () => context.revert();
  }, []);
  // --- End move ---
  return (
    <main className="relative min-h-screen overflow-x-clip bg-(--page) text-(--ink)">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-112 bg-[linear-gradient(180deg,rgba(10,152,146,0.16),rgba(10,152,146,0))]" />
        <div className="absolute -left-20 top-48 h-72 w-72 rounded-full bg-[rgba(239,42,113,0.14)] blur-[120px]" />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-[rgba(10,152,146,0.16)] blur-[130px]" />
      </div>
      <div ref={pageRef} className="relative pb-14">
        <FeedbackHeader
          activePhase={activePhase}
        />
        <section className="bg-[linear-gradient(180deg,var(--brand)_0%,var(--brand-deep)_100%)] py-10 sm:py-14">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
            <aside data-reveal className="sticky top-4 self-start lg:top-5">
              <div className="overflow-hidden rounded-4xl border border-white/22 bg-white/12 shadow-[0_22px_65px_rgba(8,80,77,0.32)] backdrop-blur-md">
                <div className="border-b border-white/14 px-5 py-5 text-white sm:px-6">
                  <p className="text-xs font-semibold tracking-[0.24em] uppercase text-white/72">Progress monitor</p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-4xl font-semibold tracking-tight">{progressPercent}%</p>
                      <p className="mt-1 text-sm text-white/72">Responses completed in selected phase</p>
                    </div>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/16">
                      <Icon icon="material-symbols:query-stats" className="text-2xl text-white" />
                    </span>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/18">
                    <span
                      className="block h-full rounded-full bg-(--highlight) transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-3 px-5 py-5 sm:px-6">
                  <label htmlFor="phase-select" className="block text-xs font-semibold tracking-[0.2em] uppercase text-white/72">
                    Select phase
                  </label>
                  <div className="relative">
                    <select
                      id="phase-select"
                      value={activePhase}
                      onChange={(event) => switchPhase(event.target.value as "phase1" | "phase2")}
                      className="w-full appearance-none rounded-2xl border border-white/20 bg-white/14 px-4 py-3 pr-11 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] outline-none transition focus:border-white/50 focus:bg-white/18 focus:ring-2 focus:ring-white/18"
                    >
                      <option value="phase1" className="text-(--ink)">Phase 1 - Pre Mid-I review</option>
                      <option value="phase2" className="text-(--ink)">Phase 2 - Post Mid-I review</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-white/78">
                      <Icon icon="material-symbols:keyboard-arrow-down-rounded" className="text-2xl" />
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-t border-white/14 bg-[rgba(6,92,89,0.28)]">
                  <div className="px-5 py-4 text-white sm:px-6">
                    <p className="text-3xl font-semibold">{Object.keys(activePhaseState.ratings).length}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/72">Rated now</p>
                  </div>
                  <div className="border-l border-white/12 px-5 py-4 text-white sm:px-6">
                    <p className="text-3xl font-semibold">{activePhaseState.remark.trim() ? 1 : 0}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/72">Remarks added</p>
                  </div>
                </div>
              </div>
            </aside>
            <div className="space-y-5">
              <div ref={phaseContainerRef}>
                <PhaseSection
                  phase={activePhaseConfig}
                  ratings={activePhaseState.ratings}
                  remark={activePhaseState.remark}
                  onRatingChange={(questionId, value) => {
                    setPhaseState((prev) => ({
                      ...prev,
                      [activePhase]: {
                        ...prev[activePhase],
                        ratings: { ...prev[activePhase].ratings, [questionId]: value },
                      },
                    }));
                  }}
                  onRemarkChange={(value) => {
                    setPhaseState((prev) => ({
                      ...prev,
                      [activePhase]: {
                        ...prev[activePhase],
                        remark: value,
                      },
                    }));
                  }}
                />
              </div>
              <div data-reveal className="flex flex-col gap-3 rounded-[1.75rem] bg-white px-5 py-5 shadow-[0_18px_50px_rgba(9,58,70,0.16)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-(--muted) uppercase">Navigation</p>
                  <p className="mt-2 text-sm text-(--muted)">
                    {activePhase === "phase1"
                      ? "Complete all ratings and add one suggestion to unlock Phase 2."
                      : "Review your ratings and submit once the phase is fully completed."}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!activePhaseComplete || isSubmitting}
                    className={
                      !activePhaseComplete || isSubmitting
                        ? "cursor-not-allowed rounded-full bg-(--accent-soft) px-6 py-3 text-sm font-semibold text-white/70"
                        : "rounded-full bg-(--accent) px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(239,42,113,0.32)] transition hover:bg-(--accent-deep)"
                    }
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer data-reveal className="bg-(--ink) py-6 text-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <span className="inline-flex items-center gap-2 text-white/78">
              <Icon icon="material-symbols:shield-lock-outline" className="text-lg text-(--highlight)" />
              Confidential responses are used only for academic quality improvement.
            </span>
            <span className="inline-flex items-center gap-2 font-medium tracking-[0.16em] uppercase text-white/78">
              {phase2Complete ? "Feedback Completed" : "Student feedback portal"}
              <Icon icon="material-symbols:keyboard-double-arrow-right" className="text-lg text-(--highlight)" />
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}  // ...existing feedback homepage code here (move all code from the previous return statement)
  // ...existing code...)}