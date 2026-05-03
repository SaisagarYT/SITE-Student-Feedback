"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useSearchParams } from "next/navigation";
import FilterBar from "../../../components/admin/FilterBar";
import AdminNavbar from "../../../components/admin/AdminNavbar";
import AdminDashboardProtected from "../dashboard/AdminDashboardProtected";
import StudentDetailsModal from "../../../components/admin/StudentDetailsModal";
import { getStudentFeedbackDetails, getAdminReport, getStudentsList, getCourseFacultyPairs } from "../../../api";

type Filters = {
  program: string;
  branchId: string;
  section: string;
  semester: string;
  phase: string;
  fromDate: string;
  toDate: string;
  academicYear: string;
};

type FeedbackRecord = {
  studentId?: string;
  studentName?: string;
  name?: string;
  rollNumber?: string;
  courseId?: string;
  courseName?: string;
  facultyId?: string;
  facultyName?: string;
  branchId?: string;
  section?: string;
  submittedAt?: string | null;
};

type DetailsResponse = { records?: FeedbackRecord[]; count?: number; expectedPairsByStudent?: Record<string, string[]> };

type StudentRow = {
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  branchId?: string;
  section?: string;
  submittedCount: number;
  expectedCount: number;
  missing: string[];
  submittedPairs: string[];
  submittedPairLabels: string[];
  missingPairLabels: string[];
  completedAll: boolean;
  lastSubmittedAt: string | null;
};

type StudentsListResponse = {
  students?: {
    studentId?: string;
    studentName?: string;
    rollNumber?: string;
  }[];
};

type BinaryFilter = "all" | "yes" | "no";
type DateSort = "newer" | "older";

function formatSubmissionDateTime(value?: string | null) {
  if (!value) return { date: "-", time: "" };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "" };

  return {
    date: new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function formatShortDateTime(value?: string | null) {
  const formatted = formatSubmissionDateTime(value);
  return formatted.date === "-" ? "-" : `${formatted.date} • ${formatted.time}`;
}

function normalizeKey(value?: string | null) {
  return value ? value.trim().toLowerCase() : "";
}

function InlineLoadingPill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(10,152,146,0.16)] bg-white/90 px-4 py-2 text-xs font-semibold text-(--brand-deep) shadow-sm">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-(--brand)" />
      Updating submissions...
    </div>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className="mt-6 grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="admin-card border border-[rgba(10,152,146,0.1)] bg-white p-5">
          <div className="h-4 w-24 rounded bg-[rgba(10,152,146,0.12)]" />
          <div className="mt-3 h-8 w-14 rounded bg-[rgba(10,152,146,0.16)]" />
          <div className="mt-3 h-3 w-28 rounded bg-[rgba(10,152,146,0.1)]" />
        </div>
      ))}
    </div>
  );
}

function TableRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, idx) => (
        <tr key={`skeleton-${idx}`} className="border-t border-[rgba(10,152,146,0.1)] animate-pulse">
          <td className="px-3 py-3"><div className="h-4 w-16 rounded bg-[rgba(10,152,146,0.12)]" /></td>
          <td className="px-3 py-3"><div className="h-4 w-36 rounded bg-[rgba(10,152,146,0.12)]" /></td>
          <td className="px-3 py-3"><div className="h-6 w-12 rounded-full bg-[rgba(10,152,146,0.12)]" /></td>
          <td className="px-3 py-3"><div className="h-6 w-12 rounded-full bg-[rgba(239,42,113,0.12)]" /></td>
          <td className="px-3 py-3"><div className="h-6 w-16 rounded-full bg-[rgba(10,152,146,0.12)]" /></td>
          <td className="px-3 py-3"><div className="h-4 w-28 rounded bg-[rgba(10,152,146,0.12)]" /></td>
          <td className="px-3 py-3"><div className="h-8 w-16 rounded-full bg-[rgba(10,152,146,0.12)]" /></td>
        </tr>
      ))}
    </>
  );
}

function StudentSubmissionsPageContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
    program: "",
    branchId: "",
    section: "",
    semester: "",
    phase: "1",
    fromDate: "",
    toDate: "",
    academicYear: ""
  });

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submittedFilter, setSubmittedFilter] = useState<BinaryFilter>("all");
  const [completedFilter, setCompletedFilter] = useState<BinaryFilter>("all");
  const [dateSort, setDateSort] = useState<DateSort>("newer");

  useEffect(() => {
    const nextFilters: Partial<Filters> = {
      program: searchParams.get("program") || "",
      branchId: searchParams.get("branchId") || "",
      section: searchParams.get("section") || "",
      semester: searchParams.get("semester") || "",
      phase: searchParams.get("phase") || "",
      fromDate: searchParams.get("fromDate") || "",
      toDate: searchParams.get("toDate") || "",
      academicYear: searchParams.get("academicYear") || "",
    };

    const hasAnyQueryFilter = Object.values(nextFilters).some(Boolean);
    if (!hasAnyQueryFilter) return;

    setFilters((prev) => ({
      ...prev,
      ...nextFilters,
      phase: nextFilters.phase || prev.phase,
    }));
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!filters.branchId) return;
      fetchData();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const phaseMapped = filters.phase === "2" ? "2" : "1";
      let academicYear = filters.academicYear;
      if (!academicYear) {
        const now = new Date();
        const year = now.getFullYear();
        const nextYear = (year + 1).toString().slice(-2);
        academicYear = `${year}-${nextYear}`;
      }

      const details = (await getStudentFeedbackDetails({
        branchId: filters.branchId,
        semester: filters.semester,
        section: filters.section,
        phase: phaseMapped,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      })) as DetailsResponse;

      const report = await getAdminReport({
        branchId: filters.branchId,
        semester: filters.semester,
        section: filters.section,
        phase: phaseMapped,
        academicYear,
        view: "section"
      });

      type AdminReportResponse = { diagnostic?: { expectedPairsList?: string[] } };
      const reportTyped = report as AdminReportResponse;
      const pairLabelMap = new Map<string, string>();
      const courseNameMap = new Map<string, string>();
      const facultyNameMap = new Map<string, string>();
      const expectedPairsByStudent = new Map<string, string[]>();

      (details.records || []).forEach((record) => {
        if (record.courseId && record.courseName) {
          courseNameMap.set(record.courseId, record.courseName);
        }
        if (record.facultyId && record.facultyName) {
          facultyNameMap.set(record.facultyId, record.facultyName);
        }
        if (record.courseId && record.facultyId) {
          const pairKey = `${record.courseId}::${record.facultyId}`;
          const hasAnyName = Boolean(record.courseName || record.facultyName);
          if (hasAnyName && !pairLabelMap.has(pairKey)) {
            const courseLabel = record.courseName || record.courseId;
            const facultyLabel = record.facultyName || record.facultyId;
            pairLabelMap.set(pairKey, `${facultyLabel} -> ${courseLabel}`);
          }
        }
      });

      if (details.expectedPairsByStudent) {
        Object.entries(details.expectedPairsByStudent).forEach(([studentId, pairs]) => {
          expectedPairsByStudent.set(normalizeKey(studentId), Array.isArray(pairs) ? pairs : []);
        });
      }

      let pairs: string[] = [];
      try {
        const pairsRes = await getCourseFacultyPairs({
          branchId: filters.branchId,
          semester: filters.semester,
          section: filters.section
        });
        type PairsResponse = { pairs?: string[]; pairDetails?: { pairKey: string; courseId?: string; courseName?: string; facultyId?: string; facultyName?: string }[]; count?: number };
        const pairsTyped = pairsRes as PairsResponse;
        if (pairsTyped && Array.isArray(pairsTyped.pairs)) {
          pairs = pairsTyped.pairs;
        }
        if (pairsTyped && Array.isArray(pairsTyped.pairDetails)) {
          pairsTyped.pairDetails.forEach((pair) => {
            if (pair?.pairKey) {
              if (pair.courseId && pair.courseName) {
                courseNameMap.set(pair.courseId, pair.courseName);
              }
              if (pair.facultyId && pair.facultyName) {
                facultyNameMap.set(pair.facultyId, pair.facultyName);
              }
              const courseLabel = pair.courseName || pair.courseId || "Course";
              const facultyLabel = pair.facultyName || pair.facultyId || "Faculty";
              pairLabelMap.set(pair.pairKey, `${facultyLabel} -> ${courseLabel}`);
            }
          });
        }
      } catch {
        // Fallback to report pairs if section-filtered endpoint fails
        pairs = (reportTyped && reportTyped.diagnostic && Array.isArray(reportTyped.diagnostic.expectedPairsList))
          ? reportTyped.diagnostic.expectedPairsList as string[]
          : [];
      }

      const getPairLabel = (pairKey: string) => {
        const known = pairLabelMap.get(pairKey);
        if (known) return known;

        const [courseId, facultyId] = pairKey.split("::");
        const courseLabel = courseNameMap.get(courseId) || courseId || "Course";
        const facultyLabel = facultyNameMap.get(facultyId) || facultyId || "Faculty";
        return `${facultyLabel} -> ${courseLabel}`;
      };

      const byStudent = new Map<string, { studentId?: string; studentName?: string; rollNumber?: string; branchId?: string; section?: string; submittedPairs: Set<string>; lastSubmittedAt: string | null }>();
      (details.records || []).forEach((r: FeedbackRecord) => {
        const sid = normalizeKey(r.studentId) || normalizeKey(r.rollNumber) || normalizeKey(r.studentName) || normalizeKey(r.name) || "unknown";
        if (!byStudent.has(sid)) {
          byStudent.set(sid, {
            studentId: r.studentId,
            studentName: r.studentName || r.name,
            rollNumber: r.rollNumber,
            branchId: r.branchId,
            section: r.section,
            submittedPairs: new Set<string>(),
            lastSubmittedAt: null
          });
        }
        const entry = byStudent.get(sid)!;
        const key = `${r.courseId}::${r.facultyId}`;
        if (key) entry.submittedPairs.add(key);
        if (r.submittedAt) {
          const dt = new Date(r.submittedAt);
          if (!entry.lastSubmittedAt || dt > new Date(entry.lastSubmittedAt)) {
            entry.lastSubmittedAt = dt.toISOString();
          }
        }
      });

      const needName = Array.from(byStudent.values()).some(v => !v.studentName);
      if (needName) {
        try {
          const studentsRes = await getStudentsList({ branchId: filters.branchId, semester: filters.semester, section: filters.section });
          const studArr = (studentsRes as StudentsListResponse).students || [];
          const nameMap = new Map<string, string>();
          studArr.forEach((s) => {
            if (s.studentId) nameMap.set(s.studentId, s.studentName || "");
            if (s.rollNumber) nameMap.set(s.rollNumber, s.studentName || "");
          });
          Array.from(byStudent.values()).forEach(v => {
            if (!v.studentName) {
              const nameFromId = v.studentId ? nameMap.get(v.studentId) : undefined;
              const nameFromRoll = v.rollNumber ? nameMap.get(v.rollNumber) : undefined;
              v.studentName = nameFromId || nameFromRoll || "";
            }
          });
        } catch {
          // ignore, keep names blank
        }
      }

      // Fallback: if still no pairs (curriculum & diagnostic both empty), infer from submissions
      let finalPairs = pairs;
      if (finalPairs.length === 0) {
        const inferredPairs = new Set<string>();
        Array.from(byStudent.values()).forEach(s => {
          s.submittedPairs.forEach(p => inferredPairs.add(p));
        });
        finalPairs = Array.from(inferredPairs);
      }

      const rows: StudentRow[] = Array.from(byStudent.values()).map(s => {
        const submittedPairs = Array.from(s.submittedPairs);
        const submittedCount = s.submittedPairs.size;
        const expectedPairsForStudent =
          expectedPairsByStudent.get(normalizeKey(s.studentId)) ||
          expectedPairsByStudent.get(normalizeKey(s.rollNumber)) ||
          expectedPairsByStudent.get(normalizeKey(s.studentName)) ||
          [];
        const expectedCount = expectedPairsForStudent.length;
        const missing = expectedCount > 0 ? expectedPairsForStudent.filter(p => !s.submittedPairs.has(p)) : [];
        const completedAll = expectedCount > 0 ? missing.length === 0 : false;
        return {
          studentId: s.studentId,
          studentName: s.studentName,
          rollNumber: s.rollNumber,
          branchId: s.branchId,
          section: s.section,
          submittedCount,
          expectedCount,
          missing,
          submittedPairs,
          submittedPairLabels: submittedPairs.map((pair) => getPairLabel(pair)),
          missingPairLabels: missing.map((pair) => getPairLabel(pair)),
          completedAll,
          lastSubmittedAt: s.lastSubmittedAt
        };
      });

      setStudents(rows.sort((a, b) => (a.rollNumber || "").localeCompare(b.rollNumber || "")));
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let rows = [...students];

    if (submittedFilter !== "all") {
      rows = rows.filter((s) => (submittedFilter === "yes" ? s.submittedCount > 0 : s.submittedCount === 0));
    }

    if (completedFilter !== "all") {
      rows = rows.filter((s) => (completedFilter === "yes" ? s.completedAll : !s.completedAll));
    }

    rows.sort((a, b) => {
      const aTs = a.lastSubmittedAt ? new Date(a.lastSubmittedAt).getTime() : Number.NaN;
      const bTs = b.lastSubmittedAt ? new Date(b.lastSubmittedAt).getTime() : Number.NaN;

      if (Number.isNaN(aTs) && Number.isNaN(bTs)) return (a.rollNumber || "").localeCompare(b.rollNumber || "");
      if (Number.isNaN(aTs)) return 1;
      if (Number.isNaN(bTs)) return -1;

      return dateSort === "newer" ? bTs - aTs : aTs - bTs;
    });

    return rows;
  }, [students, submittedFilter, completedFilter, dateSort]);

  // Calculate summary stats on filtered data
  const totalStudents = filteredStudents.length;
  const submittedCount = filteredStudents.filter(s => s.submittedCount > 0).length;
  const completedCount = filteredStudents.filter(s => s.completedAll).length;
  const pendingCount = filteredStudents.filter(s => !s.completedAll).length;
  const visibleExpectedPairsCount = filteredStudents.length > 0 ? Math.max(...filteredStudents.map(r => r.expectedCount)) : 0;

  return (
    <AdminDashboardProtected>
      <div className="admin-dashboard-shell flex min-h-screen flex-col">
        <Head>
          <title>Student Submissions</title>
        </Head>
        <AdminNavbar />
        <div className="p-4 sm:p-6 lg:p-8">
        <FilterBar filters={filters} setFilters={setFilters} onReportDatesFetched={() => {}} />

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Student Submissions</h2>
            <p className="text-sm text-(--muted)">Shows submission status per student for selected branch & section.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-(--muted)">Submitted</span>
              <select
                value={submittedFilter}
                onChange={(e) => setSubmittedFilter(e.target.value as BinaryFilter)}
                className="admin-select min-w-28 rounded-full px-3 py-1.5"
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-(--muted)">Completed</span>
              <select
                value={completedFilter}
                onChange={(e) => setCompletedFilter(e.target.value as BinaryFilter)}
                className="admin-select min-w-28 rounded-full px-3 py-1.5"
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-(--muted)">Date</span>
              <select
                value={dateSort}
                onChange={(e) => setDateSort(e.target.value as DateSort)}
                className="admin-select min-w-28 rounded-full px-3 py-1.5"
              >
                <option value="newer">Newer</option>
                <option value="older">Older</option>
              </select>
            </label>
          </div>
        </div>
        {loading && (
          <div className="mt-3">
            <InlineLoadingPill />
          </div>
        )}

        {/* Summary Cards */}
        {loading ? (
          <SummaryCardsSkeleton />
        ) : students.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Total Students Card */}
            <div className="admin-card border border-slate-200 bg-linear-to-br from-slate-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--muted)">Total Students</p>
                  <p className="mt-2 text-3xl font-bold text-(--ink)">{totalStudents}</p>
                  <p className="mt-1 text-xs text-(--muted)">in the selected filters</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-[1.75]">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M20 8v6" />
                    <path d="M23 11h-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Submitted Card */}
            <div className="admin-card border border-[rgba(10,152,146,0.2)] bg-linear-to-br from-[rgba(10,152,146,0.05)] to-[rgba(10,152,146,0.02)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--muted)">Submitted</p>
                  <p className="mt-2 text-3xl font-bold text-(--brand-deep)">{submittedCount}</p>
                  <p className="mt-1 text-xs text-(--muted)">of {totalStudents} students</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(10,152,146,0.12)] text-(--brand-deep) shadow-sm">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-[1.75]">
                    <path d="M7 12l3 3 7-7" />
                    <path d="M20 12a8 8 0 1 1-4.9-7.4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expected Pairs Card */}
            <div className="admin-card border border-slate-200 bg-linear-to-br from-slate-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--muted)">Expected Pairs</p>
                  <p className="mt-2 text-3xl font-bold text-(--ink)">{visibleExpectedPairsCount}</p>
                  <p className="mt-1 text-xs text-(--muted)">course-faculty pairs</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-[1.75]">
                    <path d="M4 7h16" />
                    <path d="M7 7v14" />
                    <path d="M17 7v14" />
                    <path d="M4 21h16" />
                    <path d="M9 11h2" />
                    <path d="M13 11h2" />
                    <path d="M9 15h2" />
                    <path d="M13 15h2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Completed Card */}
            <div className="admin-card border border-green-600/20 bg-linear-to-br from-green-50 to-green-50/40 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--muted)">Completed</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">{completedCount}</p>
                  <p className="mt-1 text-xs text-(--muted)">of {totalStudents} students</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600/10 text-green-700 shadow-sm">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-[1.75]">
                    <path d="M9 12.75 11.25 15 15 9.5" />
                    <path d="M12 2l2.2 4.4L19 8.6l-3.2 3.1.8 4.5L12 14.8 7.4 16.2l.8-4.5L5 8.6l4.8-2.2Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pending Card */}
            <div className="admin-card border border-[rgba(239,42,113,0.2)] bg-linear-to-br from-[rgba(239,42,113,0.05)] to-[rgba(239,42,113,0.02)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--muted)">Pending</p>
                  <p className="mt-2 text-3xl font-bold text-(--accent)">{pendingCount}</p>
                  <p className="mt-1 text-xs text-(--muted)">of {totalStudents} students</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(239,42,113,0.1)] text-(--accent) shadow-sm">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-[1.75]">
                    <path d="M12 8v5l3 2" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          {error && <div className="text-rose-600">{error}</div>}

          <div className="admin-table-shell mt-3 overflow-hidden">
            <div className="admin-table-section-label px-4 py-3 text-lg font-semibold">
              Student Submission Status
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="admin-table-head sticky top-0 z-10">
                  <th className="p-3 text-left">Roll / ID</th>
                  <th className="p-3 text-left">Student Name</th>
                  <th className="p-3 text-left">Submitted</th>
                  <th className="p-3 text-left">Expected</th>
                  <th className="p-3 text-left">Completed</th>
                  <th className="p-3 text-left">Last Submitted</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableRowsSkeleton />
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-(--muted)">
                      No records found for selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <tr key={s.studentId || s.rollNumber || idx} className="border-t border-[rgba(10,152,146,0.1)] transition hover:bg-[rgba(10,152,146,0.06)]">
                      <td className="px-3 py-3 align-top font-medium text-(--ink)">{s.rollNumber || s.studentId}</td>
                      <td className="px-3 py-3 align-top text-(--ink)">{s.studentName || "-"}</td>
                      <td className="px-3 py-3 align-top">
                        <span className="inline-flex min-w-10 justify-center rounded-full bg-[rgba(10,152,146,0.1)] px-3 py-1 text-sm font-semibold text-(--brand-deep)">
                          {s.submittedCount}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="inline-flex min-w-10 justify-center rounded-full bg-[rgba(239,42,113,0.08)] px-3 py-1 text-sm font-semibold text-(--accent)">
                          {s.expectedCount}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${s.completedAll ? "bg-[rgba(10,152,146,0.12)] text-(--brand-deep)" : "bg-[rgba(239,42,113,0.1)] text-(--accent)"}`}>
                          {s.completedAll ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-(--ink)">{formatShortDateTime(s.lastSubmittedAt)}</td>
                      <td className="px-3 py-3 align-top">
                        <button
                          onClick={() => { setSelectedStudent(s); setModalOpen(true); }}
                          className="rounded-full border border-[rgba(10,152,146,0.18)] bg-white px-3 py-1 text-sm font-semibold text-(--ink) transition hover:-translate-y-0.5 hover:border-[rgba(10,152,146,0.3)] hover:bg-[rgba(10,152,146,0.06)]"
                        >Details</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
        </div>
        <StudentDetailsModal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedStudent(null); }} student={selectedStudent ? {
          studentId: selectedStudent.studentId,
          studentName: selectedStudent.studentName,
          rollNumber: selectedStudent.rollNumber,
          submittedPairs: selectedStudent.submittedPairs,
          submittedPairLabels: selectedStudent.submittedPairLabels,
          expectedCount: selectedStudent.expectedCount,
          submittedCount: selectedStudent.submittedCount,
          missing: selectedStudent.missing,
          missingPairLabels: selectedStudent.missingPairLabels,
          lastSubmittedAt: selectedStudent.lastSubmittedAt
        } : null} />
      </div>
    </AdminDashboardProtected>
  );
}

export default function StudentSubmissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-dashboard-shell flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-(--brand)" />
        </div>
      }
    >
      <StudentSubmissionsPageContent />
    </Suspense>
  );
}
