import React from "react";

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
  totalStudents?: number;
  facultyDisplayName?: string;
  courseName?: string;
}


const DepartmentReport: React.FC<DepartmentReportProps> = ({
  program,
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
  submitted,
  totalStudents,
  facultyDisplayName,
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
        fontFamily: "serif",
        color: "#222",
        padding: 24,        // BIG for screen
        background: "#fff",
        width: "100%",
        fontSize: 16        // BIG for screen
      }}
    >
      <style>{`
        /* ================= SCREEN ================= */
        @media screen {
          .department-report-print {
            max-height: 80vh;
            overflow-y: auto;
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

          body * {
            visibility: hidden;
          }

          .department-report-print,
          .department-report-print * {
            visibility: visible;
          }

          .department-report-print {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;

            /* 🔥 SHRINK ONLY FOR PRINT */
            font-size: 12px;
            padding: 10px;
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
        <img
          src="/sasi_logo_main.png"
          alt="SASI Logo"
          style={{
            width: "100%",
            maxWidth: "170mm",
            maxHeight: "40mm", // big on screen
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
          }}
        />

        <div className="header-subtitle" style={{ textAlign: "center", fontWeight: 600 }}>
          Academic year 2025-26
        </div>

        <div className="header-title" style={{ textAlign: "center", fontWeight: 600 }}>
          Student Feedback Analysis
        </div>
      </div>

      {/* BODY */}
      <div
        className="body-text"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
        >
        <div>
          <b>Faculty:</b> {facultyDisplayName}
          <div><b>Program:</b> {program}</div>
          <div><b>Department:</b> {department}</div>
          <div><b>Phase:</b> {phase}</div>
          <div><b>SubmittedDate:</b> {submittedDate}</div>
          <div><b>ReportedDate:</b> {reportedDate}</div>
        </div>

        <div>
          <div><b>Course:</b> {courseName}</div>
          <div><b>Year:</b> {year}</div>
          <div><b>Sem:</b> {getSemesterNumber(semester)}</div>
          <div><b>Section:</b> {section}</div>
          {submitted !== undefined && (
            <div><b>Submitted:</b> {submitted}</div>
          )}
          {totalStudents !== undefined && (
            <div><b>Total Students:</b> {totalStudents}</div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div>
        <div style={{ fontWeight: 600, margin: "16px 0 8px" }}>
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

      {/* FOOTER */}
      <div
        className="signatures"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 40,   // big on screen
        }}
      >
        <div>Signature of Faculty</div>
        <div>HOD</div>
        <div>Dean (Academic)</div>
        <div>Principal</div>
      </div>
    </div>
  );
};

const th = {
  border: "1px solid #222",
  padding: 6,
};

const td = {
  border: "1px solid #222",
  padding: 6,
};

const tdCenter = {
  ...td,
  textAlign: "center" as const,
};

export default DepartmentReport;