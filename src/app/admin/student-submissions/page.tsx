"use client";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import FilterBar from "../../../components/admin/FilterBar";
import AdminNavbar from "../../../components/admin/AdminNavbar";
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
  facultyId?: string;
  branchId?: string;
  section?: string;
  submittedAt?: string | null;
};

type DetailsResponse = { records?: FeedbackRecord[]; count?: number };

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

export default function StudentSubmissionsPage() {
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
      let pairs: string[] = (reportTyped && reportTyped.diagnostic && Array.isArray(reportTyped.diagnostic.expectedPairsList))
        ? reportTyped.diagnostic.expectedPairsList as string[]
        : [];

      // If backend diagnostic is empty, fetch actual course-faculty pairs from curriculum
      if (pairs.length === 0) {
        try {
          const pairsRes = await getCourseFacultyPairs({
            branchId: filters.branchId,
            semester: filters.semester,
            section: filters.section
          });
          type PairsResponse = { pairs?: string[]; count?: number };
          const pairsTyped = pairsRes as PairsResponse;
          if (pairsTyped && Array.isArray(pairsTyped.pairs)) {
            pairs = pairsTyped.pairs;
          }
        } catch {
          // ignore, keep pairs empty
        }
      }

      const byStudent = new Map<string, { studentId?: string; studentName?: string; rollNumber?: string; branchId?: string; section?: string; submittedPairs: Set<string>; lastSubmittedAt: string | null }>();
      (details.records || []).forEach((r: FeedbackRecord) => {
        const sid = r.studentId || r.rollNumber || r.studentName || r.name || "unknown";
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
        const key = `${r.courseId}_${r.facultyId}`;
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
        const submittedCount = s.submittedPairs.size;
        const expectedCount = finalPairs.length;
        const missing = expectedCount > 0 ? finalPairs.filter(p => !s.submittedPairs.has(p)) : [];
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
          submittedPairs: Array.from(s.submittedPairs),
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

  return (
    <div className="admin-dashboard-shell flex min-h-screen flex-col">
      <Head>
        <title>Student Submissions</title>
      </Head>
      <AdminNavbar />
      <div className="p-4 sm:p-6 lg:p-8">
        <FilterBar filters={filters} setFilters={setFilters} onReportDatesFetched={() => {}} />

        <div className="mt-4">
          <h2 className="text-xl font-semibold">Student Submissions</h2>
          <p className="text-sm text-(--muted)">Shows submission status per student for selected branch & section.</p>
        </div>

        <div className="mt-4">
          {loading && <div className="text-(--muted)">Loading...</div>}
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
                  <th className="p-3 text-left">Missing (sample)</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-(--muted)">
                      No records found for selected filters.
                    </td>
                  </tr>
                ) : (
                  students.map((s, idx) => (
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
                      <td className="px-3 py-3 align-top text-(--muted)">{s.missing && s.missing.length > 0 ? s.missing.slice(0,3).join(", ") + (s.missing.length>3?"...":"") : "-"}</td>
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
        expectedCount: selectedStudent.expectedCount,
        submittedCount: selectedStudent.submittedCount,
        missing: selectedStudent.missing,
        lastSubmittedAt: selectedStudent.lastSubmittedAt
      } : null} />
    </div>
  );
}
