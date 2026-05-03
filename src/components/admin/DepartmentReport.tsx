import React from "react";
import Image from "next/image";

interface FacultyAnalysisRow {
  sNo: number;
  question: string;
  overallRating: string | number;
  overallPercent: string | number;
}

interface DepartmentReportProps {
  academicYear: string;
  program: string;
  year: string;
  department: string;
  semester: string;
  section: string;
  phase: string;
  submittedDate: string;
  reportedDate?: string;
  facultyRows: FacultyAnalysisRow[];
  avgRating: string | number;
  avgPercent: string | number;
  submitted?: number;
  completed?: number;
  totalStudents?: number;
  facultyDisplayName?: string;
  facultyId?: string;
  courseName?: string;
}


const DepartmentReport: React.FC<DepartmentReportProps> = ({
  program,
  academicYear,
  year,
  department,
  semester,
  section,
  phase,
  submittedDate,
  reportedDate,
  facultyRows,
  avgRating,
  avgPercent,
  
  completed,
  totalStudents,
  facultyDisplayName,
  facultyId,
  courseName,
}) => {

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
      className="department-report-print"
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

          .department-report-print {
            display: block !important;
            position: relative !important;
            width: 100%;
            margin: 0;
            background: transparent !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;

            /* 🔥 SHRINK ONLY FOR PRINT */
            font-size: 12px;
          }

          .department-report-print .body-text {
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

          .department-report-print .report-observed-by {
            display: block !important;
          }

          .department-report-print .report-signatures {
            display: flex !important;
          }

          .department-report-print .report-print-only {
            display: block !important;
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

          img {
            max-height: 22mm !important;
          }

          .signatures {
            margin-top: 8mm !important;
          }

          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ marginBottom: 8 }}>
        <Image
          src="/sasi_logo_main.png"
          alt="SASI Logo"
          className="report-print-only"
          width={1200}
          height={320}
          priority
          style={{
            width: "100%",
            maxWidth: "170mm",
            maxHeight: "40mm",
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
          marginBottom: 12,
          gap: 16,
          padding: 16,
          borderRadius: 18,
          background: "rgba(255,255,255,0.82)",
          border: "1px solid rgba(10,152,146,0.12)",
          boxShadow: "none",
        }}
        >
        <div>
          <b>Faculty:</b> {facultyDisplayName}
          <div><b>Faculty Id:</b> {facultyId}</div>
          <div><b>Program:</b> {program}</div>
          <div><b>Department:</b> {department}</div>
          <div><b>Phase:</b> {phase == "p1"?1:2}</div>
          <div><b>SubmittedDate:</b> {submittedDate}</div>
          <div><b>ReportedDate:</b> {reportedDate}</div>
        </div>

        <div>
          <div><b>Course:</b> {courseName}</div>
          <div><b>Year:</b> {year}</div>
          <div><b>Sem:</b> {getSemesterNumber(semester)}</div>
          <div><b>Section:</b> {section}</div>
          {typeof completed === "number" && (
            <div><b>Completed:</b> {completed}</div>
          )}
          {totalStudents !== undefined && (
            <div><b>Total Students:</b> {totalStudents}</div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div>
        <div style={{ fontWeight: 700, margin: "16px 0 8px", color: "var(--brand-deep)" }}>
          Faculty Individual Analysis
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>S.NO</th>
              <th style={th}>Question</th>
              <th style={th}>Overall Rating</th>
              <th style={th}>Overall %</th>
              <th style={th}>Signature</th>
            </tr>
          </thead>

          <tbody>
            {facultyRows.map((row, idx) => (
              <tr key={idx}>
                <td style={tdCenter}>{row.sNo}</td>
                <td style={td}>{row.question}</td>
                <td style={tdCenter}>{row.overallRating}</td>
                <td style={tdCenter}>{row.overallPercent}</td>
                  <td style={td}></td>
              </tr>
            ))}

            <tr>
              <td style={td}></td>
              <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>Avg:</td>
              <td style={{ ...tdCenter, fontWeight: 600 }}>{avgRating}</td>
              <td style={{ ...tdCenter, fontWeight: 600 }}>{avgPercent}</td>
                <td style={td}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="body-text" style={{ marginTop: 12 }}>
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

export default DepartmentReport;