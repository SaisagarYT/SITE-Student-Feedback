import React from "react";

export type ReportRow = {
  totalStudents: number | undefined;
  submitted: number | undefined;
  facultyId: string;
  courseId: string;
  facultyName: string;
  courseName: string;
  avgScore: number;
  percentage: number;
  category: string;
  perQuestionAverages?: Record<string, number | null>;
  type?: string;
  // submitted: number;
  // totalStudents: number;
  // submissionRate: number;
};

type ReportTableProps = {
  data: ReportRow[];
  loading: boolean;
  showPerQuestion?: boolean;
};

export default function ReportTable({ data, loading, showPerQuestion }: ReportTableProps) {
  // Determine all question keys present in the data (e.g., q1, q2, ...)
  const questionKeys = React.useMemo(() => {
    if (!showPerQuestion) return [];
    const keys = new Set<string>();
    data.forEach(row => {
      if (row.perQuestionAverages) {
        Object.keys(row.perQuestionAverages).forEach(k => keys.add(k));
      }
    });
    // Sort numerically by question number
    return Array.from(keys).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ""), 10);
      const nb = parseInt(b.replace(/\D/g, ""), 10);
      return na - nb;
    });
  }, [data, showPerQuestion]);

  // Split data into theory and lab
  const theoryRows = data.filter(row => row.type === "theory");
  const labRows = data.filter(row => row.type === "lab");

  const renderTableBody = (rows: ReportRow[], offset: number) => (
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={6 + (showPerQuestion ? questionKeys.length : 0)} className="text-center p-4 text-gray-400">
            No feedback available for selected filters
          </td>
        </tr>
      ) : (
        rows.map((row: ReportRow, i: number) => (
          <tr key={i + offset} className="border-t hover:bg-blue-50 transition">
            <td className="p-2">{i + 1 + offset}</td>
            <td className="p-2">{row.facultyName}</td>
            <td className="p-2">{row.courseName}</td>
            {/* Per-question averages only if showPerQuestion */}
            {showPerQuestion && questionKeys.map(qk => (
              <td key={qk} className="p-2">
                {row.perQuestionAverages && row.perQuestionAverages[qk] != null
                  ? row.perQuestionAverages[qk]?.toFixed(2)
                  : "-"}
              </td>
            ))}
            <td className="p-2">{row.avgScore?.toFixed(2) || "-"}</td>
            <td className="p-2">{row.percentage ?? "-"}%</td>
            <td className="p-2 font-semibold">{row.category}</td>
            {/* <td className="p-2">{row.submitted ?? 0}</td>
            <td className="p-2">{row.totalStudents ?? 0}</td>
            <td className="p-2">{row.submissionRate ?? 0}%</td> */}
          </tr>
        ))
      )}
    </tbody>
  );

  return (
    <div className="flex-1 overflow-auto bg-white rounded shadow">
      {loading ? (
        <div className="p-4 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Theory Section */}
          <div>
            <div className="font-bold text-lg p-2 bg-gray-100">Theory Subjects</div>
            <table className="w-full text-sm mb-8">
              <thead className="bg-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="p-2">S.No</th>
                  <th className="p-2">Faculty</th>
                  <th className="p-2">Course</th>
                  {showPerQuestion && questionKeys.map(qk => (
                    <th key={qk} className="p-2">{qk.toUpperCase()}</th>
                  ))}
                  <th className="p-2">Avg</th>
                  <th className="p-2">%</th>
                  <th className="p-2">Category</th>
                </tr>
              </thead>
              {renderTableBody(theoryRows, 0)}
            </table>
          </div>
          {/* Lab Section */}
          <div>
            <div className="font-bold text-lg p-2 bg-gray-100">Lab Subjects</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="p-2">S.No</th>
                  <th className="p-2">Faculty</th>
                  <th className="p-2">Course</th>
                  {showPerQuestion && questionKeys.map(qk => (
                    <th key={qk} className="p-2">{qk.toUpperCase()}</th>
                  ))}
                  <th className="p-2">Avg</th>
                  <th className="p-2">%</th>
                  <th className="p-2">Category</th>
                </tr>
              </thead>
              {renderTableBody(labRows, theoryRows.length)}
            </table>
          </div>
        </>
      )}
    </div>
  );
}
