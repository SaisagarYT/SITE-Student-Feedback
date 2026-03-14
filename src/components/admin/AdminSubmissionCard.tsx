import { feedbackPhases, ratingLabels } from "@/data/questions";
import type { StudentSubmission } from "@/data/adminSubmissions";

type AdminSubmissionCardProps = {
  submission: StudentSubmission;
};

const formatDateTime = (isoString: string) =>
  new Date(isoString).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const AdminSubmissionCard = ({ submission }: AdminSubmissionCardProps) => {
  const phaseConfig = feedbackPhases.find((phase) => phase.id === submission.phase);
  const ratings = Object.entries(submission.ratings);

  return (
    <article className="overflow-hidden rounded-[1.6rem] border border-(--line) bg-white shadow-[0_18px_50px_rgba(9,58,70,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--line) bg-(--surface-soft) px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-(--muted) uppercase">Submission ID</p>
          <p className="mt-1 text-sm font-medium text-(--ink)">{submission.id}</p>
        </div>
        <span className="rounded-full bg-(--brand) px-3 py-1 text-xs font-semibold tracking-[0.12em] text-white uppercase">
          {submission.phase}
        </span>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-xs text-(--muted)">Student Name</p>
          <p className="text-sm font-semibold text-(--ink)">{submission.studentName}</p>
        </div>
        <div>
          <p className="text-xs text-(--muted)">Student ID</p>
          <p className="text-sm font-semibold text-(--ink)">{submission.studentId}</p>
        </div>
        <div>
          <p className="text-xs text-(--muted)">Department / Year / Section</p>
          <p className="text-sm font-semibold text-(--ink)">
            {submission.department} / {submission.year} / {submission.section}
          </p>
        </div>
        <div>
          <p className="text-xs text-(--muted)">Submitted At</p>
          <p className="text-sm font-semibold text-(--ink)">{formatDateTime(submission.submittedAt)}</p>
        </div>
      </div>

      <div className="border-t border-(--line) px-5 py-5 sm:px-6">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-(--brand-deep)">
            View selected options ({ratings.length} responses)
          </summary>

          <div className="mt-4 space-y-2">
            {ratings.map(([questionId, score], index) => {
              const questionText =
                phaseConfig?.questions.find((question) => question.id === questionId)?.text ?? questionId;
              const label = ratingLabels[score] ?? `Score ${score}`;

              return (
                <div
                  key={questionId}
                  className="rounded-xl border border-(--line) bg-(--surface-soft) px-3 py-3 sm:px-4"
                >
                  <p className="text-xs text-(--muted)">Q{index + 1}</p>
                  <p className="mt-1 text-sm text-(--ink)">{questionText}</p>
                  <p className="mt-2 inline-flex rounded-full bg-(--brand)/10 px-2.5 py-1 text-xs font-medium text-(--brand-deep)">
                    {label} ({score}/5)
                  </p>
                </div>
              );
            })}
          </div>
        </details>
      </div>

      <div className="border-t border-(--line) bg-[rgba(10,152,146,0.06)] px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.14em] text-(--muted) uppercase">Student remark</p>
        <p className="mt-2 text-sm text-(--ink)">{submission.remark}</p>
      </div>
    </article>
  );
};

export default AdminSubmissionCard;
