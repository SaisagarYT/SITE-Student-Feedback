"use client";
import Head from "next/head";
// ...existing code up to the first closing return ...
// Remove everything after the first closing return (including duplicate imports and function)
import { useState, useEffect } from "react";
import { getAdminReport } from "../../../api";

import FilterBar from "../../../components/admin/FilterBar";
import Tabs from "../../../components/admin/Tabs";
import ReportHeader from "../../../components/admin/ReportHeader";
import ReportTable, { ReportRow } from "../../../components/admin/ReportTable";
import PrintButton from "../../../components/admin/PrintButton";
import AdminNavbar from "../../../components/admin/AdminNavbar";
import DepartmentReport from "../../../components/admin/DepartmentReport";
import SectionReport from "../../../components/admin/SectionReport";
import { feedbackPhases } from "../../../data/questions";

export default function AdminDashboard() {
  const [filters, setFilters] = useState({
    branchId: "ECE",
    section: "A",
    semester: "",
    phase: "1",
    fromDate: "",
    toDate: ""
  });
  const [tab, setTab] = useState("department");
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await getAdminReport({ ...filters, view: tab });
      console.log("Backend report data:", res);
      setData(res.results || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
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
  const facultyList = Array.isArray(sortedData) ? sortedData.map(row => row.facultyName) : [];
  const [selectedFaculty, setSelectedFaculty] = useState<string>(facultyList[0] || "");
  useEffect(() => {
    if (facultyList.length && !facultyList.includes(selectedFaculty)) {
      setSelectedFaculty(facultyList[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facultyList.join(",")]);

  // Find selected faculty row
  const selectedFacultyRow = Array.isArray(sortedData)
    ? sortedData.find(row => row.facultyName === selectedFaculty)
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
            <FilterBar filters={filters} setFilters={setFilters} />
            <Tabs tab={tab} setTab={setTab} />
          </div>
          {tab === "faculty" ? (
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
                    <option key={faculty} value={faculty}>{faculty}</option>
                  ))}
                </select>
              </div>
              {selectedFacultyRow ? (
                <DepartmentReport
                  academicYear="25-26"
                  program="B.Tech"
                  year="III"
                  department={filters.branchId}
                  semester={filters.semester || "ODD"}
                  section={filters.section}
                  phase={filters.phase}
                  facultyRows={facultyRows}
                  avgRating={selectedFacultyRow.avgScore?.toFixed(2) || "-"}
                  avgPercent={selectedFacultyRow.percentage?.toFixed(0) || "-"}
                />
              ) : (
                <div className="text-center text-gray-500">No faculty data available.</div>
              )}
            </>
          ) : tab === "section" ? (
            <SectionReport
              academicYear="25-26"
              program="B.Tech"
              department={filters.branchId}
              phase={filters.phase}
              year={(filters.semester && filters.semester.match(/^(I|II|III|IV)-(I|II)$/)) ? filters.semester.split('-')[0] : ""}
              semester={filters.semester || "ODD"}
              section={filters.section}
              rows={Array.isArray(sortedData) ? sortedData.map((row, idx) => ({
                sNo: idx + 1,
                facultyName: row.facultyName || "",
                course: row.courseName || "",
                overallPercent: row.percentage != null ? row.percentage.toFixed(0) : "-",
                category: row.category || "",
              })) : []}
            />
          ) : (
            <>
              <ReportHeader filters={filters} />
              <div className="flex-1 overflow-hidden flex flex-col">
                <ReportTable data={sortedData} loading={loading} showPerQuestion={tab === "faculty"} />
              </div>
            </>
          )}
          <div className="print:hidden">
            <PrintButton />
          </div>
        </div>
      </div>
    </>
  );
}