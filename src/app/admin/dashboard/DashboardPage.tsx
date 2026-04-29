"use client";
import Head from "next/head";
import { useState, useEffect } from "react";
import { getAdminReport, setFeedbackReportDates, getFeedbackReportDates, getFeedbackReportYears } from "../../../api";

import FilterBar from "../../../components/admin/FilterBar";
import Tabs from "../../../components/admin/Tabs";
import type { ReportRow } from "../../../components/admin/ReportTable";
import PrintButton from "../../../components/admin/PrintButton";
import AdminNavbar from "../../../components/admin/AdminNavbar";
import DepartmentReport from "../../../components/admin/DepartmentReport";
import SectionReport from "../../../components/admin/SectionReport";
import { feedbackPhases } from "../../../data/questions";


import { Fragment } from "react";

function FeedbackDatesSection() {
  type SemesterData = {
    semester: string;
    phase1Date?: string;
    phase2Date?: string;
    updatedAt?: string;
  };
  type YearData = {
    year: string;
    semesters: SemesterData[];
  };
  const [years, setYears] = useState<YearData[]>([]);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const formatSemesterLabel = (semester: string) => {
    if (semester === "sem1") return "Semester 1";
    if (semester === "sem2") return "Semester 2";
    return semester;
  };


  // Add form state
  const [form, setForm] = useState({ academicYear: "", semester: "", phase: "", date: "" });

  // Fetch only years/semesters that exist in Firestore
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setMessage("");
      try {
        const yearData = await getFeedbackReportYears();
        setYears(yearData);
        if (yearData.length === 0) {
          setMessage("No feedback date data found.");
        }
      } catch {
        setMessage("Failed to load feedback dates");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [showAdd]); // refetch after add

  // Add report popup handlers
  const openAdd = () => { setForm({ academicYear: "", semester: "", phase: "", date: "" }); setShowAdd(true); };
  const closeAdd = () => setShowAdd(false);

  // Add report submit
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("handleAddSubmit called", form);
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      let current: { phase1Date?: string; phase2Date?: string } = {};
      try { current = await getFeedbackReportDates({ academicYear: form.academicYear, semester: form.semester }); } catch {}
      // Normalize academicYear to YYYY-YYYY
      let normalizedYear = form.academicYear;
      const yearMatch = form.academicYear.match(/^(\d{4})[-–](\d{2,4})$/);
      if (yearMatch) {
        const start = yearMatch[1];
        let end = yearMatch[2];
        if (end.length === 2) {
          end = String(Number(start.slice(0, 2)) * 100 + Number(end));
        }
        normalizedYear = `${start}-${end}`;
      }
      const payload = {
        academicYear: normalizedYear,
        semester: form.semester,
        phase1Date: form.phase === "phase1" ? form.date : current.phase1Date || "",
        phase2Date: form.phase === "phase2" ? form.date : current.phase2Date || ""
      };
      const res = await setFeedbackReportDates(payload);
      console.log(res)
      setMessage("Date saved successfully.");
      setShowAdd(false);
    } catch {
      setMessage("Failed to save date.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card p-6 mt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--muted)">Maintenance</p>
          <h2 className="mt-1 text-xl font-bold text-(--ink)">Feedback Dates</h2>
        </div>
        <button onClick={openAdd} className="rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-deep))] px-4 py-2 text-sm font-semibold text-white shadow-none transition hover:-translate-y-0.5">+ Add Report</button>
      </div>
      {loading && <div className="text-center text-(--muted)">Loading...</div>}
      {message && <div className="mb-2 text-center font-medium text-(--brand-deep)">{message}</div>}
      {years.length === 0 && !loading ? (
        <div className="text-center text-(--muted)">No feedback dates found.</div>
      ) : (
        <div>
          {years.map((y: YearData) => (
            <Fragment key={y.year}>
              <div
                className="flex cursor-pointer items-center border-b border-[rgba(10,152,146,0.12)] py-3 text-lg font-semibold text-(--ink) transition hover:bg-[rgba(10,152,146,0.06)]"
                onClick={() => setExpandedYear(expandedYear === y.year ? null : y.year)}
              >
                <span>{y.year}</span>
                <span className="ml-auto text-xs text-(--muted)">{expandedYear === y.year ? "▲" : "▼"}</span>
              </div>
              {expandedYear === y.year && (
                <div className="overflow-x-auto mt-2 mb-4">
                  <table className="min-w-full overflow-hidden rounded-2xl border border-[rgba(10,152,146,0.12)] text-sm">
                    <thead>
                      <tr className="bg-[rgba(10,152,146,0.08)] text-(--ink)">
                        <th className="border border-[rgba(10,152,146,0.12)] px-3 py-2 text-left">Semester</th>
                        <th className="border border-[rgba(10,152,146,0.12)] px-3 py-2 text-left">Phase 1 Date</th>
                        <th className="border border-[rgba(10,152,146,0.12)] px-3 py-2 text-left">Phase 2 Date</th>
                        <th className="border border-[rgba(10,152,146,0.12)] px-3 py-2 text-left">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {y.semesters.map((s: SemesterData) => (
                        <tr key={s.semester}>
                          <td className="border border-[rgba(10,152,146,0.12)] px-3 py-2 font-semibold">{formatSemesterLabel(s.semester)}</td>
                          <td className="border border-[rgba(10,152,146,0.12)] px-3 py-2">{s.phase1Date ? new Date(s.phase1Date).toLocaleDateString() : "-"}</td>
                          <td className="border border-[rgba(10,152,146,0.12)] px-3 py-2">{s.phase2Date ? new Date(s.phase2Date).toLocaleDateString() : "-"}</td>
                          <td className="border border-[rgba(10,152,146,0.12)] px-3 py-2">{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}

      {/* Add Report Popup */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,16,16,0.42)] px-4">
          <div className="admin-card-strong relative w-full max-w-md p-6">
            <button onClick={closeAdd} className="absolute right-3 top-3 rounded-full border border-[rgba(10,152,146,0.14)] bg-white px-2 py-1 text-(--muted) transition hover:text-(--ink)">✕</button>
            <h3 className="mb-4 text-lg font-bold text-(--ink)">Add Feedback Report Date</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block font-semibold text-(--ink)">Academic Year</label>
                <input type="text" value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2025-2026" className="admin-input w-full px-3 py-2" required />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-(--ink)">Semester</label>
                <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} className="admin-select w-full px-3 py-2" required>
                  <option value="">Select Semester</option>
                  <option value="sem1">Semester 1</option>
                  <option value="sem2">Semester 2</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-(--ink)">Phase</label>
                <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))} className="admin-select w-full px-3 py-2" required>
                  <option value="">Select Phase</option>
                  <option value="phase1">Phase 1</option>
                  <option value="phase2">Phase 2</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-(--ink)">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="admin-input w-full px-3 py-2" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-deep))] px-4 py-2 text-sm font-semibold text-white shadow-none transition hover:-translate-y-0.5" disabled={loading}>Save Date</button>
                <button type="button" onClick={closeAdd} className="rounded-full border border-[rgba(10,152,146,0.16)] bg-white px-4 py-2 text-sm font-semibold text-(--ink) transition hover:bg-[rgba(10,152,146,0.06)]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [filters, setFilters] = useState({
    program: "",
    branchId: "",
    section: "",
    semester: "",
    phase: "1",
    fromDate: "",
    toDate: "",
    academicYear: ""
  });
  const [tab, setTab] = useState("section");
  const [data, setData] = useState<ReportRow[]>([]);
  const [reportDates, setReportDates] = useState<{ phase1Date?: string; phase2Date?: string } | null>(null);


  const fetchReport = async () => {
    try {
      // setLoading(true); // removed unused loading state 
      // Map phase to backend query expected value (backend expects "1" or "2")
      const phaseMapped = filters.phase === "2" ? "2" : "1";
      // Use academicYear from filters if set, else compute current year
      let academicYear = filters.academicYear;
      if (!academicYear) {
        const now = new Date();
        const year = now.getFullYear();
        const nextYear = (year + 1).toString().slice(-2);
        academicYear = `${year}-${nextYear}`;
      }
      const res = await getAdminReport({ ...filters, phase: phaseMapped, academicYear, view: tab });
      console.log(res.results)
      setData(res.results || []);
    } catch {
      setData([]);
    } finally {
      // setLoading(false); // removed unused loading state
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (filters.branchId) {
        fetchReport();
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, tab]);

  // No polling: data reloads only on filter/tab change or manual refresh

  // Sort: theory subjects first, then lab subjects
  const sortedData = Array.isArray(data)
    ? [...data].sort((a, b) => {
        if (a.type === b.type) return 0;
        if (a.type === "theory") return -1;
        if (b.type === "theory") return 1;
        return 0;
      })
    : data;

  // Faculty dropdown state
  // Build faculty list with unique facultyId and display name (name + subject type)
  const facultyList = Array.isArray(sortedData)
    ? sortedData.map(row => ({
        facultyId: row.facultyId,
        facultyName: row.facultyName,
        courseId: row.courseId,
        courseName: row.courseName,
        type: row.type,
        display: `${row.facultyName} (${row.type === "theory" ? "Theory" : row.type === "lab" ? "Lab" : row.type || ""} - ${row.courseName || row.courseId})`,
        key: `${row.facultyId}_${row.courseId}`
      }))
    : [];
  const [selectedFaculty, setSelectedFaculty] = useState<string>(facultyList[0]?.key || "");
  useEffect(() => {
    if (facultyList.length && !facultyList.some(f => f.key === selectedFaculty)) {
      setSelectedFaculty(facultyList[0]?.key || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facultyList.map(f => f.key).join(",")]);

  // Find selected faculty row by composite key (facultyId + courseId)
  const selectedFacultyRow = Array.isArray(sortedData)
    ? sortedData.find(row => `${row.facultyId}_${row.courseId}` === selectedFaculty)
    : null;

  const getHighestSubmitted = (rows: Array<{ submitted?: number }>) => {
    return rows.reduce((highest, row) => {
      return typeof row.submitted === "number" && row.submitted > highest
        ? row.submitted
        : highest;
    }, 0);
  };

  const selectedFacultyRows = Array.isArray(sortedData)
    ? sortedData.filter(row => `${row.facultyId}_${row.courseId}` === selectedFaculty)
    : [];

  const sectionHighestSubmitted = Array.isArray(sortedData)
    ? getHighestSubmitted(sortedData)
    : 0;

  const facultyHighestSubmitted = getHighestSubmitted(
    selectedFacultyRows.length > 0 && selectedFacultyRow ? selectedFacultyRows : selectedFacultyRow ? [selectedFacultyRow] : []
  );


  // Determine phase and get correct questions
  const phaseKey = filters.phase === "2" ? "phase2" : "phase1";
  const phaseObj = feedbackPhases.find(p => p.id === phaseKey);
  const questionMap = phaseObj
    ? Object.fromEntries(phaseObj.questions.map((q, i) => [
        `q${i + 1}`,
        q.text
      ]))
    : {};

  // Build questions from perQuestionAverages, using actual question text
  const facultyRows = selectedFacultyRow && selectedFacultyRow.perQuestionAverages
    ? Object.entries(selectedFacultyRow.perQuestionAverages).map(([qKey, value], idx) => ({
        sNo: idx + 1,
        question: questionMap[qKey] || qKey,
        overallRating: value != null ? value.toFixed(2) : "-",
        overallPercent: value != null ? (value * 20).toFixed(0) : "-",
      }))
    : [];

  return (
    <>
      <Head>
        <style>{`
          @media print {
            @page { margin: 0; }
            body { margin: 0; }
            header, footer { display: none !important; }
          }
        `}</style>
      </Head>
      <div className="admin-dashboard-shell flex min-h-screen flex-col print:bg-white">
        <AdminNavbar />
        <div className="flex flex-1 flex-col overflow-visible p-4 sm:p-6 lg:p-8">
          <div className="print:hidden space-y-4">
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              onReportDatesFetched={dates => {
                console.log("DashboardPage onReportDatesFetched callback received:", dates);
                setReportDates(dates);
              }}
            />
            <Tabs tab={tab} setTab={setTab} />
          </div>
          {tab === "section" ? (
              <div className="admin-soft-panel mt-4 rounded-[1.75rem] p-4 sm:p-6 lg:p-8 print:m-0! print:rounded-none! print:border-0! print:bg-transparent! print:p-0! print:shadow-none!">
                <SectionReport
                academicYear={filters.academicYear}
                program={filters.program || "B.Tech"}
                department={filters.branchId}
                phase={filters.phase === "2" ? "p2" : "p1"}
                year={(filters.semester && filters.semester.match(/^(I|II|III|IV)-(I|II)$/)) ? filters.semester.split('-')[0] : ""}
                semester={filters.semester || "ODD"}
                section={filters.section}
                submitted={sectionHighestSubmitted}
                setSection={section => setFilters(f => ({ ...f, section }))}
                rows={Array.isArray(sortedData) ? sortedData.map((row, idx) => {
                  let reportedDate = "-";
                  if (reportDates) {
                    if (filters.phase === "2" && reportDates.phase2Date) {
                      reportedDate = new Date(reportDates.phase2Date).toISOString().split("T")[0];
                    } else if (filters.phase === "1" && reportDates.phase1Date) {
                      reportedDate = new Date(reportDates.phase1Date).toISOString().split("T")[0];
                    }
                  }
                  return {
                    sNo: idx + 1,
                    facultyName: row.facultyName || "",
                    course: row.courseName || "",
                    overallPercent: row.percentage != null ? row.percentage.toFixed(0) : "-",
                    category: row.category || "",
                    submittedDate: row.submittedDate ? new Date(row.submittedDate).toISOString().split('T')[0] : "-",
                    reportedDate,
                    submitted: row.submitted,
                    totalStudents: row.totalStudents,
                  };
                }) : []}
              />
              </div>
          ) : tab === "faculty" ? (
            <>
              <div className="admin-card mt-4 mb-4 flex flex-wrap items-center gap-3 p-4 print:hidden">
                <label htmlFor="faculty-select" className="font-semibold text-(--ink)">Select Faculty:</label>
                <select
                  id="faculty-select"
                  value={selectedFaculty}
                  onChange={e => setSelectedFaculty(e.target.value)}
                  className="admin-select min-w-80 px-3 py-2"
                >
                  {facultyList.map(faculty => (
                    <option key={faculty.key} value={faculty.key}>
                      {faculty.display}
                    </option>
                  ))}
                </select>
              </div>
              {selectedFacultyRow ? (
                (() => {
                  // Determine the correct reported date based on phase
                  //
                  let reportedDate = "-";
                  if (reportDates) {
                    if (filters.phase === "2" && reportDates.phase2Date) {
                      reportedDate = new Date(reportDates.phase2Date).toISOString().split("T")[0];
                    } else if (filters.phase === "1" && reportDates.phase1Date) {
                      reportedDate = new Date(reportDates.phase1Date).toISOString().split("T")[0];
                    }
                  }
                  //
                  return (
                    <div className="admin-soft-panel mt-4 rounded-[1.75rem] p-4 sm:p-6 lg:p-8 print:m-0! print:rounded-none! print:border-0! print:bg-transparent! print:p-0! print:shadow-none!">
                      <DepartmentReport
                      academicYear={filters.academicYear}
                      program={filters.program || "B.Tech"}
                      year="III"
                      department={filters.branchId}
                      semester={filters.semester || "ODD"}
                      section={filters.section}
                      phase={filters.phase === "2" ? "p2" : "p1"}
                      facultyRows={facultyRows}
                      avgRating={selectedFacultyRow.avgScore?.toFixed(2) || "-"}
                      avgPercent={selectedFacultyRow.percentage?.toFixed(0) || "-"}
                      submitted={facultyHighestSubmitted}
                      totalStudents={selectedFacultyRow.totalStudents}
                      submittedDate={selectedFacultyRow.submittedDate ? new Date(selectedFacultyRow.submittedDate).toISOString().split('T')[0] : "-"}
                      reportedDate={reportedDate}
                      facultyDisplayName={facultyList.find(f => f.key === selectedFaculty)?.facultyName || ""}
                      facultyId={facultyList.find(f => f.key === selectedFaculty)?.facultyId || ""}
                      courseName={facultyList.find(f => f.key === selectedFaculty)?.courseName || ""}
                    />
                    </div>
                  );
                })()
              ) : (
                <div className="admin-card mt-4 p-6 text-center text-(--muted)">No faculty data available.</div>
              )}
            </>
          ) : tab === "dates" ? (
            <FeedbackDatesSection />
          ) : null}
          <div className="print:hidden mt-4">
            <PrintButton />
          </div>
        </div>
      </div>
    </>
  );
}