import React from "react";

type ReportRow = {
  facultyName: string;
  courseName: string;
  avgScore: number;
  percentage: number;
  category: string;
};

type ReportTableProps = {
  data: ReportRow[];
  loading: boolean;
};

export default function ReportTable({ data, loading }: ReportTableProps) {
  return (
    <div className="flex-1 overflow-auto bg-white rounded shadow">
      {loading ? (
        <div className="p-4 text-center text-gray-500">Loading...</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              <th className="p-2">S.No</th>
              <th className="p-2">Faculty</th>
              <th className="p-2">Course</th>
              <th className="p-2">Avg</th>
              <th className="p-2">%</th>
              <th className="p-2">Category</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-400">
                  No feedback available for selected filters
                </td>
              </tr>
            ) : (
              data.map((row: ReportRow, i: number) => (
                <tr key={i} className="border-t hover:bg-blue-50 transition">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{row.facultyName}</td>
                  <td className="p-2">{row.courseName}</td>
                  <td className="p-2">{typeof row.avgScore === 'number' ? row.avgScore.toFixed(2) : '-'}</td>
                  <td className="p-2">{row.percentage}%</td>
                  <td className="p-2 font-semibold">{row.category}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
