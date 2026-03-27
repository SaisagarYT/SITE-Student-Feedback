import React from "react";

interface InsightPanelProps {
  data?: { message: string }[];
}

export default function InsightPanel({ data }: InsightPanelProps) {
  if (!data) {
    return (
      <div className="bg-white shadow rounded-xl p-4">
        <h3 className="font-semibold mb-3">Insights</h3>
        <div className="text-gray-400 text-sm">No insights available.</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white shadow rounded-xl p-4">
        <h3 className="font-semibold mb-3">Insights</h3>
        <div className="text-gray-400 text-sm">No insights to display.</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h3 className="font-semibold mb-3">Insights</h3>
      {data.map((item, i) => (
        <div key={i} className="text-red-500 text-sm mb-2">
          {item.message}
        </div>
      ))}
    </div>
  );
}
