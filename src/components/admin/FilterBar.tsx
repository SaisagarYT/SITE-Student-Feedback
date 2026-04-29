import React, { useEffect, useState } from "react";
import { getFeedbackReportYears, getFeedbackReportDates, getPhase2Active, setPhaseActivation } from "../../api";

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
  "B.Tech": ["CSE", "IT", "ECE", "ECT", "EEE", "ME", "CE", "AIML", "CSM", "CSD", "CIC", "CST"],
  "M.Tech": ["AI", "VLSI"],
  "MBA": ["MBA"],
};

export default function FilterBar({ filters, setFilters, onReportDatesFetched }: FilterBarProps) {
  const departmentOptions = filters.program ? PROGRAM_DEPARTMENTS[filters.program] || [] : [];
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);
  const [phase2Active, setPhase2ActiveState] = useState(false);
  const [phase2Loading, setPhase2Loading] = useState(true);
  const [phase2Updating, setPhase2Updating] = useState(false);
  const [phase2Error, setPhase2Error] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    async function fetchPhaseActivation() {
      setPhase2Loading(true);
      setPhase2Error(null);
      try {
        const active = await getPhase2Active();
        if (!cancelled) {
          setPhase2ActiveState(active);
        }
      } catch {
        if (!cancelled) {
          setPhase2ActiveState(false);
          setPhase2Error("Failed to load phase 2 status");
        }
      } finally {
        if (!cancelled) {
          setPhase2Loading(false);
        }
      }
    }

    fetchPhaseActivation();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch report dates when both academicYear and semester are set
  useEffect(() => {
    async function fetchDates() {
      if (filters.academicYear && filters.semester) { 
        try {
          // Map semester to sem1/sem2
          const semesterMapped = filters.semester.endsWith("-I") ? "sem1" : "sem2";
          const dates: ReportDates = await getFeedbackReportDates({ academicYear: filters.academicYear, semester: semesterMapped });
          if (typeof onReportDatesFetched === 'function') {
            onReportDatesFetched(dates);
          }
        } catch {
          if (typeof onReportDatesFetched === 'function') {
            onReportDatesFetched(null);
          }
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

  const handlePhaseToggle = async () => {
    const nextValue = !phase2Active;
    setPhase2Updating(true);
    setPhase2Error(null);
    try {
      await setPhaseActivation(nextValue);
      setPhase2ActiveState(nextValue);
    } catch {
      setPhase2Error("Failed to update phase 2 status");
    } finally {
      setPhase2Updating(false);
    }
  };

  return (
    <div className="admin-card p-4 mb-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--muted)">Dashboard filters</p>
          <h3 className="mt-1 text-lg font-semibold text-(--ink)">Refine the report view</h3>
        </div>
        <div className="rounded-full border border-[rgba(10,152,146,0.16)] bg-[rgba(10,152,146,0.06)] px-3 py-1 text-xs font-medium text-(--brand-deep)">
          Phase 2 {phase2Loading ? "syncing" : phase2Active ? "enabled" : "disabled"}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Program Filter */}
          <select
            className="admin-select min-w-30 px-3 py-2"
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
            className="admin-select min-w-30 px-3 py-2"
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
            className="admin-select min-w-25 px-3 py-2"
            value={filters.academicYear}
            onChange={e => setFilters(f => ({ ...f, academicYear: e.target.value }))}
            disabled={!filters.program || loadingYears || yearOptions.length === 0}
          >
            <option value="">{loadingYears ? "Loading..." : "Academic Year"}</option>
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {yearError && <span className="text-xs font-medium text-rose-600">{yearError}</span>}

          {/* Semester Filter */}
          <select
            className="admin-select min-w-25 px-3 py-2"
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
            className="admin-select min-w-25 px-3 py-2"
            value={filters.phase}
            onChange={e => setFilters(f => ({ ...f, phase: e.target.value }))}
            disabled={!filters.program}
          >
            <option value="1">Phase 1</option>
            <option value="2">Phase 2</option>
          </select>
        </div>

        <div className="ml-auto flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handlePhaseToggle}
            disabled={phase2Loading || phase2Updating}
            aria-pressed={phase2Active}
            className={`inline-flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold transition ${
              phase2Active
                ? "admin-pill-active"
                : "admin-pill"
            } ${phase2Loading || phase2Updating ? "cursor-not-allowed opacity-60" : "hover:-translate-y-0.5"}`}
          >
            <span className="whitespace-nowrap">Phase 2</span>
            <span className={`relative h-5 w-10 overflow-hidden rounded-full transition ${phase2Active ? "bg-(--brand)" : "bg-slate-400"}`}>
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
                  phase2Active ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
            <span>{phase2Loading ? "Loading" : phase2Active ? "Active" : "Inactive"}</span>
          </button>
          {phase2Error && <span className="text-xs text-rose-600">{phase2Error}</span>}
        </div>
      </div>
    </div>
  );
}
