import React from "react";

interface FacultyReportRow {
  sNo: number;
  facultyName: string;
  course: string;
  section: string;
  overallPercent: string | number;
  category: string;
}

interface FacultyReportProps {
  academicYear: string;
  program: string;
  department: string;
  phase: string;
  year: string;
  semester: string;
  rows: FacultyReportRow[];
}

const FacultyReport: React.FC<FacultyReportProps> = ({
  academicYear,
  program,
  department,
  phase,
  year,
  semester,
  rows = [],
}) => {
  function getSemesterNumber(sem: string) {
    const romanMap: Record<string, number> = {
      'I': 1,
      'II': 2,
      'III': 3,
      'IV': 4,
    };
    const match = sem.match(/^(I|II|III|IV)-(I|II)$/);
    if (match) {
      const year = romanMap[match[1]];
      const part = match[2] === 'I' ? 1 : 2;
      return (year - 1) * 2 + part;
    }
    return sem;
  }
  return (
    <div
      className="faculty-report-print w-full"
      style={{ fontFamily: 'serif', color: '#222', padding: '8mm', background: '#fff', width: '100%' }}
    >
      <style>{`
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
          .faculty-report-print,
          .faculty-report-print * {
            visibility: visible;
          }
          .faculty-report-print {
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
          Academic Tear {academicYear}
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
          <div><b>Phase:</b> {phase == "p1"?1:2}</div>
        </div>
        <div>
          <div><b>Year:</b> {year}</div>
          <div><b>Sem:</b> {getSemesterNumber(semester)}</div>
        </div>
      </div>
      {/* TABLE */}
      <div>
        <div style={{ fontWeight: 600, margin: '16px 0 8px 0', fontSize: 16 }}>Faculty Details</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #222', padding: 6 }}>S.NO</th>
              <th style={{ border: '1px solid #222', padding: 6 }}>Name of Faculty</th>
              <th style={{ border: '1px solid #222', padding: 6 }}>Course</th>
              <th style={{ border: '1px solid #222', padding: 6 }}>Section</th>
              <th style={{ border: '1px solid #222', padding: 6 }}>Overall %</th>
              <th style={{ border: '1px solid #222', padding: 6 }}>Category</th>
              <th style={{ border: '1px solid #222', padding: 6 }}>Signature</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(rows) && rows.length > 0 ? (
              rows.map((row, idx) => (
                <tr key={row.sNo + '-' + row.facultyName + '-' + row.course + '-' + row.section}>
                  <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.sNo}</td>
                  <td style={{ border: '1px solid #222', padding: 4 }}>{row.facultyName}</td>
                  <td style={{ border: '1px solid #222', padding: 4 }}>{row.course}</td>
                  <td style={{ border: '1px solid #222', padding: 4 }}>{row.section}</td>
                  <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.overallPercent}</td>
                  <td style={{ border: '1px solid #222', padding: 4 }}>{row.category}</td>
                  <td style={{ border: '1px solid #222', padding: 4 }}></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 8, color: '#888' }}>No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* FOOTER */}
      <div className="no-break signatures" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
      <p><b>Plan of Action By</b></p>
        <div>Signature of Faculty</div>
        <div>HOD</div>
        <div>Dean (Academic's) signature</div>
        <div>Principal signature</div>
      </div>
    </div>
  );
};

export default FacultyReport;
