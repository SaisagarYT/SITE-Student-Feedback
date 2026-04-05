import React from "react";

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
  setSection,
  rows,
}) => {
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
        fontFamily: "serif",
        color: "#222",
        padding: 24,     // BIG for screen
        background: "#fff",
        width: "100%",
        fontSize: 16     // BIG for screen
      }}
    >
      <style>{`
        /* ================= SCREEN ================= */
        @media screen {
          .section-report-print {
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

          .section-report-print,
          .section-report-print * {
            visibility: visible;
          }

          .section-report-print {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;

            /* shrink ONLY for print */
            font-size: 12px;
            padding: 10px;
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
        <label style={{ marginRight: 8, fontWeight: 600 }}>Section:</label>
        <select
          value={section}
          onChange={e => setSection(e.target.value)}
          style={{ border: "1px solid #ccc", padding: "4px 8px", borderRadius: 4 }}
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
        <img
          src="/sasi_logo_main.png"
          alt="SASI Logo"
          style={{
            width: "100%",
            maxWidth: "170mm",
            maxHeight: "35mm", // big for screen
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
          }}
        />

        <div className="header-subtitle" style={{ textAlign: "center", fontWeight: 600 }}>
          Academic Year {academicYear}
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
          <div><b>Program:</b> {program}</div>
          <div><b>Department:</b> {department}</div>
          <div><b>Phase:</b> {phase == "p1"? "1": "2"}</div>
          {/* Show SubmittedDate and ReportedDate below Phase */}
          <div><b>SubmittedDate:</b> {rows && rows.length > 0 ? rows[0].submittedDate || '-' : '-'}</div>
          <div><b>ReportedDate:</b> {rows && rows.length > 0 ? rows[0].reportedDate || '-' : '-'}</div>
        </div>

        {/* Calculate overall submitted and total students for this section */}
        {(() => {
          const totalSubmitted = rows.reduce((sum, row) => sum + (typeof row.submitted === 'number' ? row.submitted : 0), 0);
          const totalStudents = rows.reduce((sum, row) => sum + (typeof row.totalStudents === 'number' ? row.totalStudents : 0), 0);
          return (
            <div>
              <div><b>Year:</b> {year}</div>
              <div><b>Sem:</b> {getSemesterNumber(semester)}</div>
              <div><b>Section:</b> {section}</div>
              <div><b>Submitted:</b> {totalSubmitted}</div>
              <div><b>Total Students:</b> {totalStudents}</div>
            </div>
          );
        })()}
      </div>

      {/* TABLE */}
      <div>
        <div style={{ fontWeight: 600, margin: "16px 0 8px" }}>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div
        className="signatures"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 40, // big for screen
        }}
      >
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

export default SectionReport;