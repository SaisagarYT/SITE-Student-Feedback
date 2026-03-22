// import { feedbackPhases, ratingLabels } from "@/data/questions";
// import { useEffect, useState } from "react";
// import { getAllStudentFeedbacks } from "@/api";

// // Only require email, all other fields optional for backend-driven display

// type PhaseFeedback = {
//   ratings: Record<string, number>;
//   remark: string;
// };

// type AdminSubmissionCardProps = {
//   submission: { email: string };
// };

// const AdminSubmissionCard = ({ submission }: AdminSubmissionCardProps) => {
//   const [phase1, setPhase1] = useState<PhaseFeedback | null>(null);
//   const [phase2, setPhase2] = useState<PhaseFeedback | null>(null);
//   const [loading, setLoading] = useState(true);
//   const email = submission.email;


//   useEffect(() => {
//     let mounted = true;
//     getAllStudentFeedbacks().then((feedbacks: Array<{ email: string; phase1?: PhaseFeedback; phase2?: PhaseFeedback }>) => {
//       if (!mounted) return;
//       const found = feedbacks.find((fb) => fb.email === email);
//       // Logging for debugging
//       console.log("[AdminSubmissionCard] email:", email);
//       console.log("[AdminSubmissionCard] found feedback:", found);
//       if (found) {
//         console.log("[AdminSubmissionCard] phase1:", found.phase1);
//         console.log("[AdminSubmissionCard] phase2:", found.phase2);
//       }
//       setPhase1(found?.phase1 || null);
//       setPhase2(found?.phase2 || null);
//       setLoading(false);
//     }).catch((err) => {
//       console.error("[AdminSubmissionCard] Error fetching feedbacks:", err);
//       setLoading(false);
//     });
//     return () => { mounted = false; };
//   }, [email]);

//   if (loading) {
//     return <div className="p-6 text-center text-(--muted)">Loading feedback...</div>;
//   }

//   if (!phase1 && !phase2) {
//     return <div className="p-6 text-center text-(--muted)">No feedback found for this student.</div>;
//   }

//   return (
//     <article className="overflow-hidden rounded-[1.6rem] border border-(--line) bg-white shadow-[0_18px_50px_rgba(9,58,70,0.12)]">
//       <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--line) bg-(--surface-soft) px-5 py-4 sm:px-6">
//         <div>
//           <p className="text-xs font-semibold tracking-[0.16em] text-(--muted) uppercase">Email</p>
//           <p className="mt-1 text-sm font-medium text-(--ink)">{email}</p>
//         </div>
//       </div>

//       {/* Phase 1 dropdown */}
//       {phase1 && (
//         <div className="border-t border-(--line) px-5 py-5 sm:px-6">
//           <details>
//             <summary className="cursor-pointer text-sm font-semibold text-(--brand-deep)">
//               View selected options ({Object.keys(phase1.ratings).length} responses) <span className="ml-2 text-xs text-(--muted)">(phase-1)</span>
//             </summary>
//             <div className="mt-4 space-y-2">
//               {Object.entries(phase1.ratings).map(([questionId, score], index) => {
//                 const phaseConfig = feedbackPhases.find((phase) => phase.id === 'phase1');
//                 const questionText = phaseConfig?.questions.find((question) => question.id === questionId)?.text ?? questionId;
//                 const label = ratingLabels[score as number] ?? `Score ${score}`;
//                 return (
//                   <div key={questionId} className="rounded-xl border border-(--line) bg-(--surface-soft) px-3 py-3 sm:px-4">
//                     <p className="text-xs text-(--muted)">Q{index + 1}</p>
//                     <p className="mt-1 text-sm text-(--ink)">{questionText}</p>
//                     <p className="mt-2 inline-flex rounded-full bg-(--brand)/10 px-2.5 py-1 text-xs font-medium text-(--brand-deep)">{label} ({score}/5)</p>
//                   </div>
//                 );
//               })}
//             </div>
//           </details>
//         </div>
//       )}

//       {/* Phase 2 dropdown */}
//       {phase2 && (
//         <div className="border-t border-(--line) px-5 py-5 sm:px-6">
//           <details>
//             <summary className="cursor-pointer text-sm font-semibold text-(--brand-deep)">
//               View selected options ({Object.keys(phase2.ratings).length} responses) <span className="ml-2 text-xs text-(--muted)">(phase-2)</span>
//             </summary>
//             <div className="mt-4 space-y-2">
//               {Object.entries(phase2.ratings).map(([questionId, score], index) => {
//                 const phaseConfig = feedbackPhases.find((phase) => phase.id === 'phase2');
//                 const questionText = phaseConfig?.questions.find((question) => question.id === questionId)?.text ?? questionId;
//                 const label = ratingLabels[score as number] ?? `Score ${score}`;
//                 return (
//                   <div key={questionId} className="rounded-xl border border-(--line) bg-(--surface-soft) px-3 py-3 sm:px-4">
//                     <p className="text-xs text-(--muted)">Q{index + 1}</p>
//                     <p className="mt-1 text-sm text-(--ink)">{questionText}</p>
//                     <p className="mt-2 inline-flex rounded-full bg-(--brand)/10 px-2.5 py-1 text-xs font-medium text-(--brand-deep)">{label} ({score}/5)</p>
//                   </div>
//                 );
//               })}
//             </div>
//           </details>
//         </div>
//       )}

//       {/* Student remarks for both phases */}
//       <div className="border-t border-(--line) bg-[rgba(10,152,146,0.06)] px-5 py-4 sm:px-6">
//         <p className="text-xs font-semibold tracking-[0.14em] text-(--muted) uppercase">Student remark</p>
//         <div className="mt-2 text-sm text-(--ink)">
//           {phase1 && (
//             <div><span className="font-semibold">(phase-1)</span> {phase1.remark}</div>
//           )}
//           {phase2 && (
//             <div className="mt-1"><span className="font-semibold">(phase-2)</span> {phase2.remark}</div>
//           )}
//         </div>
//       </div>
//     </article>
//   );
// };

// export default AdminSubmissionCard;
