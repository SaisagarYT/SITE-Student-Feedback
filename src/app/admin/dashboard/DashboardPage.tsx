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
    <div className="w-full bg-white p-6 rounded shadow mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Feedback Dates</h2>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded">+ Add Report</button>
      </div>
      {loading && <div className="text-center text-gray-500">Loading...</div>}
      {message && <div className="text-center text-blue-700 mb-2">{message}</div>}
      {years.length === 0 && !loading ? (
        <div className="text-center text-gray-400">No feedback dates found.</div>
      ) : (
        <div>
          {years.map((y: YearData) => (
            <Fragment key={y.year}>
              <div
                className="cursor-pointer font-semibold text-lg py-2 border-b hover:bg-gray-50 flex items-center"
                onClick={() => setExpandedYear(expandedYear === y.year ? null : y.year)}
              >
                <span>{y.year}</span>
                <span className="ml-auto text-xs text-gray-500">{expandedYear === y.year ? "▲" : "▼"}</span>
              </div>
              {expandedYear === y.year && (
                <div className="overflow-x-auto mt-2 mb-4">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-2 py-1">Semester</th>
                        <th className="border px-2 py-1">Phase 1 Date</th>
                        <th className="border px-2 py-1">Phase 2 Date</th>
                        <th className="border px-2 py-1">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {y.semesters.map((s: SemesterData) => (
                        <tr key={s.semester}>
                          <td className="border px-2 py-1 font-semibold">{formatSemesterLabel(s.semester)}</td>
                          <td className="border px-2 py-1">{s.phase1Date ? new Date(s.phase1Date).toLocaleDateString() : "-"}</td>
                          <td className="border px-2 py-1">{s.phase2Date ? new Date(s.phase2Date).toLocaleDateString() : "-"}</td>
                          <td className="border px-2 py-1">{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "-"}</td>
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
        <div className="fixed inset-0 bg-white bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
            <button onClick={closeAdd} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">✕</button>
            <h3 className="text-lg font-bold mb-4">Add Feedback Report Date</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Academic Year</label>
                <input type="text" value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2025-2026" className="border rounded px-3 py-2 w-full" required />
              </div>
              <div>
                <label className="block font-semibold mb-1">Semester</label>
                <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select Semester</option>
                  <option value="sem1">Semester 1</option>
                  <option value="sem2">Semester 2</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Phase</label>
                <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))} className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select Phase</option>
                  <option value="phase1">Phase 1</option>
                  <option value="phase2">Phase 2</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="border rounded px-3 py-2 w-full" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>Save Date</button>
                <button type="button" onClick={closeAdd} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
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
      // Map phase to backend/DB format
      const phaseMapped = filters.phase === "2" ? "p2" : "p1";
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
      <div className="h-screen flex flex-col bg-gray-100 print:bg-white">
        <AdminNavbar />
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <div className="print:hidden">
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
              <SectionReport
                academicYear={filters.academicYear}
                program={filters.program || "B.Tech"}
                department={filters.branchId}
                phase={filters.phase === "2" ? "p2" : "p1"}
                year={(filters.semester && filters.semester.match(/^(I|II|III|IV)-(I|II)$/)) ? filters.semester.split('-')[0] : ""}
                semester={filters.semester || "ODD"}
                section={filters.section}
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
          ) : tab === "faculty" ? (
            <>
              <div className="mb-4 print:hidden">
                <label htmlFor="faculty-select" className="mr-2 font-semibold">Select Faculty:</label>
                <select
                  id="faculty-select"
                  value={selectedFaculty}
                  onChange={e => setSelectedFaculty(e.target.value)}
                  className="border rounded px-2 py-1"
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
                      submitted={selectedFacultyRow.submitted}
                      totalStudents={selectedFacultyRow.totalStudents}
                      submittedDate={selectedFacultyRow.submittedDate ? new Date(selectedFacultyRow.submittedDate).toISOString().split('T')[0] : "-"}
                      reportedDate={reportedDate}
                      facultyDisplayName={facultyList.find(f => f.key === selectedFaculty)?.facultyName || ""}
                      facultyId={facultyList.find(f => f.key === selectedFaculty)?.facultyId || ""}
                      courseName={facultyList.find(f => f.key === selectedFaculty)?.courseName || ""}
                    />
                  );
                })()
              ) : (
                <div className="text-center text-gray-500">No faculty data available.</div>
              )}
            </>
          ) : tab === "dates" ? (
            <FeedbackDatesSection />
          ) : null}
          <div className="print:hidden">
            <PrintButton />
          </div>
        </div>
      </div>
    </>
  );
}