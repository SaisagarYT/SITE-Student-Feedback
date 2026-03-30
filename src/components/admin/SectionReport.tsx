import React from "react";

interface SectionReportRow {
  sNo: number;
  facultyName: string;
  course: string;
  overallPercent: string | number;
  category: string;
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
  // Helper to convert semester string to number if possible
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
      className="section-report-print w-full"
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
          .section-report-print,
          .section-report-print * {
            visibility: visible;
          }
          .section-report-print {
            width: 100%;
            max-width: 190mm;
            max-height: 270mm;
            overflow: hidden;
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
        @media screen {
          .section-report-print {
            max-height: 80vh;
            overflow-y: auto;
          }
        }
      `}</style>
      {/* SECTION FILTER */}
      <div className="mb-4 print:hidden" style={{ textAlign: 'right' }}>
        <label htmlFor="section-select" className="mr-2 font-semibold">Section:</label>
        <select
          id="section-select"
          value={section}
          onChange={e => setSection(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">All</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>
      {/* HEADER */}
      <div className="no-break" style={{ width: '100%', marginBottom: 2 }}>
        <img
          src="/sasi_logo_main.png"
          alt="SASI Logo"
          style={{
            maxWidth: '170mm',
            maxHeight: '28mm',
            width: '100%',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto',
          }}
        />
        <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 14, marginTop: 2 }}>
          Academic year {academicYear}
        </div>
        <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 16, margin: '2px 0' }}>
          Student Feedback Analysis
        </div>
      </div>
      {/* BODY */}
      <div className="no-break" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
        <div>
          <div><b>Program:</b> {program}</div>
          <div><b>Department:</b> {department}</div>
          <div><b>Phase:</b> {phase}</div>
        </div>
        <div>
          <div><b>Year:</b> {year}</div>
          <div><b>Sem:</b> {getSemesterNumber(semester)}</div>
          <div><b>Section:</b> {section}</div>
        </div>
      </div>
      {/* TABLE */}
      <div>
        <div style={{ fontWeight: 600, margin: '8px 0 4px 0', fontSize: 14 }}>Sectionwise Analysis</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #222', padding: 4 }}>S.no</th>
              <th style={{ border: '1px solid #222', padding: 4 }}>Name of Faculty</th>
              <th style={{ border: '1px solid #222', padding: 4 }}>Course</th>
              <th style={{ border: '1px solid #222', padding: 4 }}>Overall %</th>
              <th style={{ border: '1px solid #222', padding: 4 }}>Category</th>
              <th style={{ border: '1px solid #222', padding: 4 }}>Signature</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.sNo}</td>
                <td style={{ border: '1px solid #222', padding: 4 }}>{row.facultyName}</td>
                <td style={{ border: '1px solid #222', padding: 4 }}>{row.course}</td>
                <td style={{ border: '1px solid #222', padding: 4, textAlign: 'center' }}>{row.overallPercent}</td>
                <td style={{ border: '1px solid #222', padding: 4 }}>{row.category}</td>
                <td style={{ border: '1px solid #222', padding: 4 }}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* FOOTER */}
      <div className="no-break signatures" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
        <div>HOD</div>
        <div>Dean (Academic&apos;s)</div>
        <div>Principal</div>
      </div>
    </div>
  );
};

export default SectionReport;
