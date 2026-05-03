import Image from "next/image";
import React, { useEffect, useState } from "react";
import { getStudentFeedbackDetails } from "../../api";

interface SectionReportRow {
  sNo: number;
  facultyName: string;
  course: string;
  overallPercent: string | number;
  category: string;
  submittedDate?: string;
  reportedDate?: string;
  submitted?: number;
  totalStudents?: number;
}

interface SectionReportProps {
  academicYear: string;
  program: string;
  department: string;
  phase: string;
  year: string;
  semester: string;
  section: string;
  submitted?: number;
  completed?: number;
  setSection: (section: string) => void;
  rows: SectionReportRow[];
}

const SectionReport: React.FC<SectionReportProps> = ({
  academicYear,
  program,
  department,
  phase,
  year,
  semester,
  section,
  completed,
  setSection,
  rows,
}) => {
  const [fallbackCompleted, setFallbackCompleted] = useState<number | null>(null);
  const [loadingCompleted, setLoadingCompleted] = useState(false);

  function normalizeKey(value?: string | null) {
    return value ? value.trim().toLowerCase() : "";
  }

  useEffect(() => {
    // If parent provided completed, no need to fetch. If department is missing, skip.
    if (typeof completed === "number" || !department) {
      setFallbackCompleted(null);
      return;
    }

    let cancelled = false;
    async function fetchCompleted() {
      setLoadingCompleted(true);
      try {
        const phaseMapped = phase === "p2" ? "2" : "1";
        type FeedbackRecord = {
          studentId?: string;
          studentName?: string;
          name?: string;
          rollNumber?: string;
          courseId?: string;
          facultyId?: string;
          submittedAt?: string | null;
        };

        type DetailsResponse = {
          records?: FeedbackRecord[];
          expectedPairsByStudent?: Record<string, string[]>;
        };

        const details = (await getStudentFeedbackDetails({
          branchId: department,
          semester,
          section: section || undefined,
          phase: phaseMapped,
        })) as DetailsResponse;

        const records = Array.isArray(details?.records) ? details.records : [];
        const expectedPairsByStudent = details?.expectedPairsByStudent || {};

        const byStudent = new Map<string, { submittedPairs: Set<string> }>();
        records.forEach((r) => {
          const sid = normalizeKey((r as FeedbackRecord).studentId) || normalizeKey((r as FeedbackRecord).rollNumber) || normalizeKey((r as FeedbackRecord).studentName) || normalizeKey((r as FeedbackRecord).name) || "unknown";
          if (!byStudent.has(sid)) byStudent.set(sid, { submittedPairs: new Set<string>() });
          const entry = byStudent.get(sid)!;
          const key = `${(r as FeedbackRecord).courseId}::${(r as FeedbackRecord).facultyId}`;
          if (key) entry.submittedPairs.add(key);
        });

        const completedCount = Array.from(byStudent.entries()).filter(([sid, val]) => {
          const expectedForThisStudent = expectedPairsByStudent[sid] || expectedPairsByStudent[Object.keys(expectedPairsByStudent)[0]] || [];
          return expectedForThisStudent.length === 0 || expectedForThisStudent.every((p: string) => val.submittedPairs.has(p));
        }).length;

        if (!cancelled) setFallbackCompleted(completedCount);
      } catch {
        if (!cancelled) setFallbackCompleted(null);
      } finally {
        if (!cancelled) setLoadingCompleted(false);
      }
    }

    fetchCompleted();
    return () => { cancelled = true; };
  }, [department, semester, section, phase, completed]);
  // Debug: log rows to check submittedDate and reportedDate
  console.log("SectionReport rows:", rows);

  function getSemesterNumber(sem: string) {
    const romanMap: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4,
    };
    const match = sem.match(/^(I|II|III|IV)-(I|II)$/);
    if (match) {
      const year = romanMap[match[1]];
      const part = match[2] === "I" ? 1 : 2;
      return (year - 1) * 2 + part;
    }
    return sem;
  }

  return (
    <div
      className="section-report-print"
      style={{
        fontFamily: "var(--font-body), serif",
        color: "var(--ink)",
        padding: 24,
        background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(239,247,245,0.92))",
        width: "100%",
        fontSize: 16
      }}
    >
      <style>{`
        /* ================= SCREEN ================= */
        @media screen {
          .report-print-only,
          .report-observed-by,
          .report-signatures {
            display: none !important;
          }
        }

        /* ================= PRINT ================= */
        @media print {
          @page {
            size: A4;
            margin: 6mm;
          }

          html, body {
            margin: 0;
            padding: 0;
          }

          .section-report-print {
            display: block !important;
            position: relative !important;
            width: 100%;
            margin: 0;
            background: transparent !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;

            /* shrink ONLY for print */
            font-size: 12px;
          }

          .section-report-print .body-text {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            gap: 18px !important;
            padding: 0 !important;
            margin-top: 6mm !important;
            margin-bottom: 10px !important;
            border: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          .section-report-print .report-observed-by {
            display: block !important;
          }

          .section-report-print .report-signatures {
            display: flex !important;
          }

          .section-report-print .report-print-only {
            display: block !important;
          }

          img {
            max-height: 22mm !important;
          }

          .header-title {
            font-size: 16px !important;
          }

          .header-subtitle {
            font-size: 14px !important;
          }

          .body-text {
            font-size: 12px !important;
          }

          table {
            font-size: 11px !important;
            border-collapse: collapse;
          }

          th, td {
            padding: 3px !important;
            line-height: 1.2;
          }

          tr {
            page-break-inside: avoid;
          }

          .signatures {
            margin-top: 8mm !important;
          }
        }
      `}</style>

      {/* SECTION FILTER */}
      <div style={{ textAlign: "right", marginBottom: 12 }} className="print:hidden">
        <label style={{ marginRight: 8, fontWeight: 700, color: "var(--brand-deep)" }}>Section:</label>
        <select
          value={section}
          onChange={e => setSection(e.target.value)}
          style={{ border: "1px solid rgba(10,152,146,0.22)", padding: "8px 12px", borderRadius: 12, background: "rgba(255,255,255,0.92)", color: "var(--ink)" }}
        >
          <option value="">All</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>

      {/* HEADER */}
      <div style={{ marginBottom: 8 }}>
        <Image
          src="/sasi_logo_main.png"
          alt="SASI Logo"
          width={1200}
          height={320}
          priority
          className="report-print-only"
          style={{
            width: "100%",
            maxWidth: "170mm",
            maxHeight: "35mm",
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
          }}
        />

        <div className="header-subtitle" style={{ textAlign: "center", fontWeight: 600 }}>
          Academic Year {academicYear} 
        </div>

        <div className="header-title" style={{ textAlign: "center", fontWeight: 700, color: "var(--brand-deep)", marginBottom: 12 }}>
          Student Feedback Individual Analysis on Teaching & Learning
        </div>
      </div>

      {/* BODY */}
      <div
        className="body-text"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
          marginBottom: 12,
          gap: 16,
          padding: 16,
          borderRadius: 18,
          background: "rgba(255,255,255,0.82)",
          border: "1px solid rgba(10,152,146,0.12)",
          boxShadow: "0 12px 30px rgba(9,58,70,0.08)",
        }}
        >
        <div>
          <div><b>Program:</b> {program}</div>
          <div><b>Department:</b> {department}</div>
          <div><b>Phase:</b> {phase == "p1"? "1": "2"}</div>
          {/* Show SubmittedDate and ReportedDate below Phase */}
          <div><b>SubmittedDate:</b> {rows && rows.length > 0 ? rows[0].submittedDate || '-' : '-'}</div>
          <div><b>ReportedDate:</b> {rows && rows.length > 0 ? rows[0].reportedDate || '-' : '-'}</div>
        </div>

        {/* Use section-level counts returned by backend; do not sum per-row duplicates */}
        {(() => {
          const firstRow = rows[0];
            const totalStudents = typeof firstRow?.totalStudents === "number" ? firstRow.totalStudents : 0;
          return (
            <div>
              <div><b>Year:</b> {year}</div>
              <div><b>Sem:</b> {getSemesterNumber(semester)}</div>
              <div><b>Section:</b> {section}</div>
              {typeof completed === "number" ? (
                <div><b>Completed:</b> {completed}</div>
              ) : (
                (loadingCompleted ? <div><b>Completed:</b> Loading...</div> : (fallbackCompleted !== null ? <div><b>Completed:</b> {fallbackCompleted}</div> : null))
              )}
              <div><b>Total Students:</b> {totalStudents}</div>
            </div>
          );
        })()}
      </div>

      {/* TABLE */}
      <div>
        <div style={{ fontWeight: 700, margin: "16px 0 8px", color: "var(--brand-deep)" }}>
          Sectionwise Analysis
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>S.No</th>
              <th style={th}>Faculty</th>
              <th style={th}>Course</th>
              <th style={th}>Percentage (%)</th>
              <th style={th}>Category</th>
              <th style={th}>Signature</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td style={tdCenter}>{row.sNo}</td>
                <td style={td}>{row.facultyName}</td>
                <td style={td}>{row.course}</td>
                <td style={tdCenter}>{row.overallPercent}</td>
                <td style={td}>{row.category}</td>
                <td style={td}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     <div>
        <br /><br />
        <div className="report-observed-by">
          <p style={{fontSize:"17px", marginBottom:"7px"}}><b>Observed By</b></p>
          <p>HOD</p>
          <p>Principal</p>
          <p>Plan of Action by Faculty</p>
        </div>
      </div>
      {/* FOOTER */}
      <div style={{marginTop:"60px"}}>
        <div
          className="signatures report-signatures"
          style={{
            display: "flex",
            justifyContent: "space-between"   // big on screen
          }}
        >
          <div>Signature of Faculty</div>
          <div>HOD</div>
          <div>Dean (Academic&apos;s)</div>
          <div>Principal</div>
        </div>
      </div>
    </div>
  );
};

const th = {
  border: "1px solid rgba(10,152,146,0.22)",
  padding: 8,
  background: "rgba(10,152,146,0.08)",
};

const td = {
  border: "1px solid rgba(10,152,146,0.16)",
  padding: 8,
};

const tdCenter = {
  ...td,
  textAlign: "center" as const,
};

export default SectionReport;