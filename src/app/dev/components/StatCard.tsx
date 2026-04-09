import React from "react";

export default function StatCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex flex-col items-center bg-white rounded-lg shadow p-4 min-w-[120px]">
      <span className="text-2xl font-bold text-blue-700">{count}</span>
      <span className="text-gray-600 mt-1">{label}</span>
    </div>
  );
}
