import React from "react";

export default function DataTable({ columns, data }: {
  columns: string[];
  data: any[];
}) {
  if (!data.length) return <div className="text-gray-500">No data found.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col} className="px-3 py-2 border-b bg-gray-50 text-left text-xs font-semibold text-gray-700">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="even:bg-gray-50">
              {columns.map(col => (
                <td key={col} className="px-3 py-2 border-b text-sm">{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
