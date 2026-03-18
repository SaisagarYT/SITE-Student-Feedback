"use client";

import Link from "next/link";
import AdminSubmissionCard from "@/components/admin/AdminSubmissionCard";
import AdminNavbar from "@/components/admin/AdminNavbar";

import { useState } from "react";
import { mockSubmissions } from "@/data/adminSubmissions";

import AdminRootProtected from "./AdminRootProtected";

export default function AdminDashboardPage() {
  const [searchId, setSearchId] = useState("");
  const [searchedId, setSearchedId] = useState<string | null>(null);
  // Use static mockSubmissions for all feedbacks
  const allFeedbacks = mockSubmissions;

  return (
    <AdminRootProtected>
      <AdminNavbar />
      <main className="relative min-h-screen overflow-x-clip bg-(--page) text-(--ink)">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-112 bg-[linear-gradient(180deg,rgba(10,152,146,0.16),rgba(10,152,146,0))]" />
          <div className="absolute -left-20 top-48 h-72 w-72 rounded-full bg-[rgba(239,42,113,0.12)] blur-[120px]" />
          <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-[rgba(10,152,146,0.14)] blur-[130px]" />
        </div>

        <section className="relative border-b border-(--line) bg-white/90 backdrop-blur-sm">
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
            <form
              className="flex items-center gap-3"
              onSubmit={e => {
                e.preventDefault();
                setSearchedId(searchId.trim());
              }}
            >
              <input
                type="text"
                placeholder="Search by student ID"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                className="rounded-full border border-(--line) px-4 py-2 text-sm focus:border-(--brand) focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-(--brand) px-4 py-2 text-sm font-semibold text-white hover:bg-(--brand-deep) transition"
              >
                Search
              </button>
            </form>
          </div>
        </section>
        <section className="relative py-8 sm:py-10">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Static summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-(--line) bg-white px-5 py-5 shadow-[0_14px_35px_rgba(8,80,77,0.1)]">
                <p className="text-xs font-semibold tracking-[0.14em] text-(--muted) uppercase">Total submissions</p>
                <p className="mt-2 text-3xl font-semibold text-(--brand-deep)">{allFeedbacks.length}</p>
              </div>
              <div className="rounded-3xl border border-(--line) bg-white px-5 py-5 shadow-[0_14px_35px_rgba(8,80,77,0.1)]">
                <p className="text-xs font-semibold tracking-[0.14em] text-(--muted) uppercase">Phase 1 responses</p>
                <p className="mt-2 text-3xl font-semibold text-(--brand-deep)">{allFeedbacks.filter(fb => fb.phase === "phase1").length}</p>
              </div>
              <div className="rounded-3xl border border-(--line) bg-white px-5 py-5 shadow-[0_14px_35px_rgba(8,80,77,0.1)]">
                <p className="text-xs font-semibold tracking-[0.14em] text-(--muted) uppercase">Phase 2 responses</p>
                <p className="mt-2 text-3xl font-semibold text-(--brand-deep)">{allFeedbacks.filter(fb => fb.phase === "phase2").length}</p>
              </div>
              <div className="rounded-3xl border border-(--line) bg-white px-5 py-5 shadow-[0_14px_35px_rgba(8,80,77,0.1)]">
                <p className="text-xs font-semibold tracking-[0.14em] text-(--muted) uppercase">Average rating</p>
                <p className="mt-2 text-3xl font-semibold text-(--brand-deep)">{(allFeedbacks.reduce((acc, fb) => acc + (Object.values(fb.ratings).reduce((a, b) => a + b, 0) / Object.values(fb.ratings).length), 0) / allFeedbacks.length).toFixed(2)} / 5</p>
              </div>
            </div>
            <div className="mt-7 space-y-4">
              {searchedId ? (
                <>
                  {allFeedbacks.filter(fb => fb.studentId === searchedId).length > 0 ? (
                    allFeedbacks.filter(fb => fb.studentId === searchedId).map(fb => (
                      <AdminSubmissionCard key={fb.id} submission={{ email: fb.studentId }} />
                    ))
                  ) : (
                    <div className="text-center text-(--muted)">No feedback found for this student ID.</div>
                  )}
                </>
              ) : (
                <>
                  {allFeedbacks.length > 0 ? (
                    allFeedbacks.map(fb => (
                      <AdminSubmissionCard key={fb.id} submission={{ email: fb.studentId }} />
                    ))
                  ) : (
                    <div className="text-center text-(--muted)">No feedback submissions found.</div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </AdminRootProtected>
  );
}
