import React from "react";

type ReportHeaderProps = {
  filters: {
    branchId: string;
    section: string;
    semester: string;
    phase: string;
    fromDate: string;
    toDate: string;
  };
};

export default function ReportHeader({ filters }: ReportHeaderProps) {
  return (
    <div className="bg-white p-4 rounded shadow mb-3">
      <h2 className="text-xl font-bold text-center">
        Phase-{filters.phase} Feedback Analysis
      </h2>
      <div className="flex justify-between text-sm mt-3">
        <span><b>Dept:</b> {filters.branchId || "-"}</span>
        <span><b>Section:</b> {filters.section || "-"}</span>
        <span><b>Semester:</b> {filters.semester || "-"}</span>
        <span><b>Date:</b> {
          filters.fromDate || filters.toDate
            ? `${filters.fromDate}${filters.toDate ? ` - ${filters.toDate}` : ""}`
            : "-"
        }</span>
      </div>
    </div>
  );
}
