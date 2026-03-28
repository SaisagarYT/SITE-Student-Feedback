import React from "react";

export default function PrintButton() {
  return (
    <div className="mt-3 flex justify-end">
      <button
        onClick={() => window.print()}
        className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
      >
        Print Report
      </button>
    </div>
  );
}
