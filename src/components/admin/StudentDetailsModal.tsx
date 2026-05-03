import React from "react";

function formatSubmissionDateTime(value?: string | null) {
  if (!value) return { date: "-", time: "" };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "" };

  return {
    date: new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  student: {
    studentId?: string;
    studentName?: string;
    rollNumber?: string;
    submittedPairs: string[];
    submittedPairLabels?: string[];
    expectedCount: number;
    submittedCount: number;
    missing: string[];
    missingPairLabels?: string[];
    lastSubmittedAt?: string | null;
  } | null;
};

export default function StudentDetailsModal({ open, onClose, student }: Props) {
  if (!open || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(3,16,16,0.5)] px-4 py-6">
      <div className="admin-card-strong flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden p-6">
        <div className="flex items-start justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold">{student.studentName || student.rollNumber || student.studentId}</h3>
            <p className="text-sm text-(--muted)">Roll: {student.rollNumber || "-"} • ID: {student.studentId || "-"}</p>
          </div>
          <button onClick={onClose} className="text-(--muted)">✕</button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-3">
            <div className="text-sm">
              <strong>Submitted:</strong> {student.submittedCount} / {student.expectedCount}
            </div>
            <div className="rounded-2xl border border-[rgba(10,152,146,0.12)] bg-[rgba(10,152,146,0.04)] px-4 py-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">Last Submitted</div>
              {(() => {
                const submittedAt = formatSubmissionDateTime(student.lastSubmittedAt);
                return submittedAt.date === "-" ? (
                  <div className="mt-1 text-(--muted)">-</div>
                ) : (
                  <div className="mt-1 flex flex-col">
                    <span className="text-base font-semibold text-(--ink)">{submittedAt.date}</span>
                    <span className="text-sm text-(--muted)">{submittedAt.time}</span>
                  </div>
                );
              })()}
            </div>

            <div>
              <strong className="block mb-2">Submitted Pairs</strong>
              {student.submittedPairs.length === 0 ? (
                <div className="text-(--muted)">No submissions</div>
              ) : (
                <ul className="space-y-2">
                  {(student.submittedPairLabels || student.submittedPairs).map((p, index) => (
                    <li key={`${p}-${index}`} className="wrap-break-word rounded-xl border border-[rgba(10,152,146,0.12)] bg-[rgba(10,152,146,0.04)] px-3 py-2 text-sm">{p}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <strong className="block mb-2">Missing Pairs</strong>
              {student.missing.length === 0 ? (
                <div className="text-(--muted)">None</div>
              ) : (
                <ul className="space-y-2">
                  {(student.missingPairLabels || student.missing).map((p, index) => (
                    <li key={`${p}-${index}`} className="wrap-break-word rounded-xl border border-[rgba(239,42,113,0.12)] bg-[rgba(239,42,113,0.04)] px-3 py-2 text-sm">{p}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 shrink-0 text-right">
          <button onClick={onClose} className="rounded-full border border-[rgba(10,152,146,0.16)] bg-white px-4 py-2 text-sm font-semibold">Close</button>
        </div>
      </div>
    </div>
  );
}
