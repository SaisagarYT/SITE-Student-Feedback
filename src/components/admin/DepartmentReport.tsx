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
  facultyRows: FacultyAnalysisRow[];
  avgRating: string | number;
  avgPercent: string | number;
  submitted?: number;
  totalStudents?: number;
}

const DepartmentReport: React.FC<DepartmentReportProps> = ({
  program,
  year,
  department,
  semester,
  section,
  phase,
  facultyRows,
  avgRating,
  avgPercent,
  submitted,
  totalStudents,
}) => {
  // Helper to convert semester string to number if possible
  function getSemesterNumber(sem: string) {
    // Map Roman numerals to numbers
    const romanMap: Record<string, number> = {
      'I': 1,
      'II': 2,
      'III': 3,
      'IV': 4,
    };
    // Match patterns like 'III-II', 'II-I', etc.
    const match = sem.match(/^(I|II|III|IV)-(I|II)$/);
    if (match) {
      const year = romanMap[match[1]];
      const part = match[2] === 'I' ? 1 : 2;
      // Semester number: (year - 1) * 2 + part
      return (year - 1) * 2 + part;
    }
    return sem;
  }

  return (
    <div
      className="department-report-print w-full"
      style={{ fontFamily: 'serif', color: '#222', padding: 24, background: '#fff', width: '100%' }}
    >
      <style>{`
        @media screen {
          .department-report-print {
            max-height: 80vh;
            overflow-y: auto;
          }
        }
        @media print {
          @page {
            size: A4;
            margin: 12mm;
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
            width: 100%;
            max-width: 190mm;
            margin: auto;
            page-break-inside: avoid;
          }
          .no-break {
            page-break-inside: avoid;
          }
          .signatures {
            margin-top: 20mm;
          }
        }
      `}</style>
      {/* HEADER */}
      <div className="no-break" style={{ width: '100%', marginBottom: 6 }}>
        <img
          src="/sasi_logo_main.png"
          alt="SASI Logo"
          style={{
            maxWidth: '170mm',
            maxHeight: '40mm',
            width: '100%',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto',
          }}
        />
        <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 18, marginTop: 4 }}>
          Academic year 2025-26
        </div>
        <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 20, margin: '4px 0' }}>
          Student Feedback Analysis
        </div>
      </div>
      {/* BODY */}
      <div className="no-break" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 16 }}>
        <div>
          <div><b>Program:</b> {program}</div>
          <div><b>Department:</b> {department}</div>
          <div><b>Phase:</b> {phase}</div>
        </div>
        <div>
          <div><b>Year:</b> {year}</div>
          <div><b>Sem:</b> {getSemesterNumber(semester)}</div>
          <div><b>Section:</b> {section}</div>
          {typeof submitted !== 'undefined' && (
            <div><b>Submitted:</b> {submitted}</div>
          )}
          {typeof totalStudents !== 'undefined' && (
            <div><b>Total Students:</b> {totalStudents}</div>
          )}
        </div>
      </div>
      {/* TABLE */}
      <div>
        <div style={{ fontWeight: 600, margin: '16px 0 8px 0', fontSize: 16 }}>Faculty Individual Analysis</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #222', padding: 6 }}>S.NO</th>
              <th style={{ border: '1px solid #222', padding: 6 }}>Question</th>
              <th style={{ border: '1px solid #222', padding: 6 }}>Overall Rating</th>
              <th style={{ border: '1px solid #222', padding: 6 }}>Overall %</th>
            </tr>
          </thead>
          <tbody>
            {facultyRows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #222', padding: 6, textAlign: 'center' }}>{row.sNo}</td>
                <td style={{ border: '1px solid #222', padding: 6 }}>{row.question}</td>
                <td style={{ border: '1px solid #222', padding: 6, textAlign: 'center' }}>{row.overallRating}</td>
                <td style={{ border: '1px solid #222', padding: 6, textAlign: 'center' }}>{row.overallPercent}</td>
              </tr>
            ))}
            <tr>
              <td style={{ border: '1px solid #222', padding: 6 }}></td>
              <td style={{ border: '1px solid #222', padding: 6, textAlign: 'right', fontWeight: 600 }}>Avg:</td>
              <td style={{ border: '1px solid #222', padding: 6, textAlign: 'center', fontWeight: 600 }}>{avgRating}</td>
              <td style={{ border: '1px solid #222', padding: 6, textAlign: 'center', fontWeight: 600 }}>{avgPercent}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* FOOTER */}
      <div className="no-break signatures" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
        <div>Signature of Faculty</div>
        <div>HOD</div>
        <div>Dean (Academic&apos;s)</div>
        <div>Principal</div>
      </div>
    </div>
  );
};

export default DepartmentReport;
