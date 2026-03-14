import Link from "next/link";
import AdminSubmissionCard from "@/components/admin/AdminSubmissionCard";
import { mockSubmissions } from "@/data/adminSubmissions";

const averageScore = (() => {
  const allScores = mockSubmissions.flatMap((submission) => Object.values(submission.ratings));
  const total = allScores.reduce((sum, score) => sum + score, 0);
  return allScores.length ? (total / allScores.length).toFixed(2) : "0.00";
})();

const phase1Count = mockSubmissions.filter((submission) => submission.phase === "phase1").length;
const phase2Count = mockSubmissions.filter((submission) => submission.phase === "phase2").length;
const withRemarkCount = mockSubmissions.filter((submission) => submission.remark.trim().length > 0).length;

export default function AdminDashboardPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-(--page) text-(--ink)">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-112 bg-[linear-gradient(180deg,rgba(10,152,146,0.16),rgba(10,152,146,0))]" />
        <div className="absolute -left-20 top-48 h-72 w-72 rounded-full bg-[rgba(239,42,113,0.12)] blur-[120px]" />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-[rgba(10,152,146,0.14)] blur-[130px]" />
      </div>

      <><section className="relative border-b border-(--line) bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-(--muted) uppercase">Admin dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-(--ink) sm:text-3xl">
                Student Feedback Submission Center
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-(--muted)">
                View all student submissions, inspect selected options question-by-question, and monitor phase-wise
                response patterns in one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-full border border-(--line-strong) bg-white px-5 py-2.5 text-sm font-semibold text-(--brand-deep) transition hover:border-(--brand)"
              >
                Back to feedback form
              </Link>
            </div>
          </div>
        </section><section className="relative py-8 sm:py-10">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-(--line) bg-white px-5 py-5 shadow-[0_14px_35px_rgba(8,80,77,0.1)]">
                  <p className="text-xs font-semibold tracking-[0.14em] text-(--muted) uppercase">Total submissions</p>
                  <p className="mt-2 text-3xl font-semibold text-(--brand-deep)">{mockSubmissions.length}</p>
                </div>
                <div className="rounded-3xl border border-(--line) bg-white px-5 py-5 shadow-[0_14px_35px_rgba(8,80,77,0.1)]">
                  <p className="text-xs font-semibold tracking-[0.14em] text-(--muted) uppercase">Phase 1 responses</p>
                  <p className="mt-2 text-3xl font-semibold text-(--brand-deep)">{phase1Count}</p>
                </div>
                <div className="rounded-3xl border border-(--line) bg-white px-5 py-5 shadow-[0_14px_35px_rgba(8,80,77,0.1)]">
                  <p className="text-xs font-semibold tracking-[0.14em] text-(--muted) uppercase">Phase 2 responses</p>
                  <p className="mt-2 text-3xl font-semibold text-(--brand-deep)">{phase2Count}</p>
                </div>
                <div className="rounded-3xl border border-(--line) bg-white px-5 py-5 shadow-[0_14px_35px_rgba(8,80,77,0.1)]">
                  <p className="text-xs font-semibold tracking-[0.14em] text-(--muted) uppercase">Average rating</p>
                  <p className="mt-2 text-3xl font-semibold text-(--brand-deep)">{averageScore} / 5</p>
                  <p className="mt-1 text-xs text-(--muted)">{withRemarkCount} submissions include remarks</p>
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {mockSubmissions.map((submission) => (
                  <AdminSubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            </div>
          </section></>
    </main>
  );
}
