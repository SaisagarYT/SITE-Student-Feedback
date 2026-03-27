import { ReactNode } from "react";

type TableRow = Record<string, ReactNode>;

interface DataTableProps {
  title: string;
  data: TableRow[];
}

export default function DataTable({ title, data }: DataTableProps) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-400">No data available</div>;
  }
  const headers = Object.keys(data[0]);
  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr>
            {headers.map((key) => (
              <th key={key} className="text-left">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {headers.map((header, j) => (
                <td key={j}>{row[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
