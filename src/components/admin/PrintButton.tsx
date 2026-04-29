import React from "react";

export default function PrintButton() {
  return (
    <div className="mt-3 flex justify-end">
      <button
        onClick={() => window.print()}
        className="rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-deep))] px-5 py-2.5 text-sm font-semibold text-white shadow-none transition hover:-translate-y-0.5"
      >
        Print Report
      </button>
    </div>
  );
}
