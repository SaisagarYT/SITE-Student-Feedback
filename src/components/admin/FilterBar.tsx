import React, { useEffect, useState } from "react";
import { getFeedbackReportYears, getFeedbackReportDates } from "../../api";

type ReportDates = {
  phase1Date?: string;
  phase2Date?: string;
};

type FilterBarProps = {
  filters: {
    program: string;
    branchId: string;
    section: string;
    semester: string;
    phase: string;
    fromDate: string;
    toDate: string;
    academicYear: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    program: string;
    branchId: string;
    section: string;
    semester: string;
    phase: string;
    fromDate: string;
    toDate: string;
    academicYear: string;
  }>>;
  onReportDatesFetched: (dates: ReportDates | null) => void;
};

const PROGRAM_DEPARTMENTS: Record<string, string[]> = {
  "B.Tech": ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "AIML", "CSM", "CSD", "CIC", "CST"],
  "M.Tech": ["AI", "VLSI"],
  "MBA": ["MBA"],
};

export default function FilterBar({ filters, setFilters, onReportDatesFetched }: FilterBarProps) {
  const departmentOptions = filters.program ? PROGRAM_DEPARTMENTS[filters.program] || [] : [];
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);
  const [datesLoading, setDatesLoading] = useState(false);
  const [datesError, setDatesError] = useState<string | null>(null);

  // Fetch year options when program is set
  useEffect(() => {
    if (!filters.program) {
      return;
    }
    Promise.resolve().then(() => {
      setLoadingYears(true);
      setYearError(null);
    });
    getFeedbackReportYears()
      .then((years: { year: string; semesters: { semester: string; phase1Date?: string; phase2Date?: string; updatedAt?: string }[] }[]) => {
        setYearOptions(years.map((y) => y.year));
      })
      .catch(() => setYearError("Failed to load years"))
      .finally(() => setLoadingYears(false));
  }, [filters.program]);

  // Fetch report dates when both academicYear and semester are set
  useEffect(() => {
    async function fetchDates() {
      if (filters.academicYear && filters.semester) { 
        setDatesLoading(true);
        setDatesError(null);
        try {
          // Map semester to sem1/sem2
          const semesterMapped = filters.semester.endsWith("-I") ? "sem1" : "sem2";
          const dates: ReportDates = await getFeedbackReportDates({ academicYear: filters.academicYear, semester: semesterMapped });
          if (typeof onReportDatesFetched === 'function') {
            onReportDatesFetched(dates);
          }
        } catch (err) {
          setDatesError("Failed to fetch report dates");
          if (typeof onReportDatesFetched === 'function') {
            onReportDatesFetched(null);
          }
        } finally {
          setDatesLoading(false);
        }
      } else {
        if (typeof onReportDatesFetched === 'function') {
          onReportDatesFetched(null);
        }
      }
    }
    fetchDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.academicYear, filters.semester]);

  return (
    <div className="bg-white p-3 rounded shadow flex flex-wrap gap-3 mb-3">
      {/* Program Filter */}
      <select
        className="border p-2 rounded min-w-30"
        value={filters.program}
        onChange={e => {
          const value = e.target.value;
          setFilters({
            program: value,
            branchId: "",
            section: "",
            semester: "",
            phase: "1",
            fromDate: "",
            toDate: "",
            academicYear: ""
          });
        }}
      >
        <option value="">Program</option>
        <option value="B.Tech">B.Tech</option>
        <option value="M.Tech">M.Tech</option>
        <option value="MBA">MBA</option>
      </select>

      {/* Department Filter (dynamic) */}
      <select
        className="border p-2 rounded min-w-30"
        value={filters.branchId}
        onChange={e => setFilters(f => ({ ...f, branchId: e.target.value }))}
        disabled={!filters.program}
      >
        <option value="">Department</option>
        {departmentOptions.map(dep => (
          <option key={dep} value={dep}>{dep}</option>
        ))}
      </select>

      {/* Academic Year Filter */}
      <select
        className="border p-2 rounded min-w-25"
        value={filters.academicYear}
        onChange={e => setFilters(f => ({ ...f, academicYear: e.target.value }))}
        disabled={!filters.program || loadingYears || yearOptions.length === 0}
      >
        <option value="">{loadingYears ? "Loading..." : "Academic Year"}</option>
        {yearOptions.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      {yearError && <span className="text-red-500 text-xs">{yearError}</span>}

      {/* Semester Filter */}
      <select
        className="border p-2 rounded min-w-25"
        value={filters.semester}
        onChange={e => setFilters(f => ({ ...f, semester: e.target.value }))}
        disabled={!filters.program}
      >
        <option value="">Year & Sem</option>
        <option value="I-I">I-I</option>
        <option value="I-II">I-II</option>
        <option value="II-I">II-I</option>
        <option value="II-II">II-II</option>
        <option value="III-I">III-I</option>
        <option value="III-II">III-II</option>
        <option value="IV-I">IV-I</option>
        <option value="IV-II">IV-II</option>
      </select>

      {/* Phase Filter */}
      <select
        className="border p-2 rounded min-w-25"
        value={filters.phase}
        onChange={e => setFilters(f => ({ ...f, phase: e.target.value }))}
        disabled={!filters.program}
      >
        <option value="1">Phase 1</option>
        <option value="2">Phase 2</option>
      </select>

    </div>
  );
}
