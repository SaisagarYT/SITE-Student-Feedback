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
    <div className="admin-card p-4 mb-4">
      <h2 className="text-xl font-bold text-center text-(--brand-deep)">
        Phase-{filters.phase} Feedback Analysis
      </h2>
      <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm text-(--ink)">
        <span className="rounded-full border border-[rgba(10,152,146,0.16)] bg-[rgba(10,152,146,0.06)] px-3 py-2"><b>Dept:</b> {filters.branchId || "-"}</span>
        <span className="rounded-full border border-[rgba(10,152,146,0.16)] bg-[rgba(10,152,146,0.06)] px-3 py-2"><b>Section:</b> {filters.section || "-"}</span>
        <span className="rounded-full border border-[rgba(10,152,146,0.16)] bg-[rgba(10,152,146,0.06)] px-3 py-2"><b>Semester:</b> {filters.semester || "-"}</span>
        <span className="rounded-full border border-[rgba(10,152,146,0.16)] bg-[rgba(10,152,146,0.06)] px-3 py-2">
          <b>Date:</b>{" "}
          {filters.fromDate || filters.toDate
            ? `${filters.fromDate}${filters.toDate ? ` - ${filters.toDate}` : ""}`
            : "-"}
        </span>
      </div>
    </div>
  );
}
