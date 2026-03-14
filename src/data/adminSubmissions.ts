export type SubmissionPhase = "phase1" | "phase2";

export type StudentSubmission = {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  year: string;
  section: string;
  submittedAt: string;
  phase: SubmissionPhase;
  ratings: Record<string, number>;
  remark: string;
};

export const mockSubmissions: StudentSubmission[] = [
  {
    id: "sub_001",
    studentId: "23CSE014",
    studentName: "Aarav Reddy",
    department: "CSE",
    year: "II Year",
    section: "A",
    submittedAt: "2026-03-14T09:12:00Z",
    phase: "phase1",
    ratings: {
      p1_q1: 5,
      p1_q2: 4,
      p1_q3: 4,
      p1_q4: 5,
      p1_q5: 4,
      p1_q6: 5,
      p1_q7: 4,
      p1_q8: 5,
      p1_q9: 2
    },
    remark: "More live coding examples in class would help reinforce concepts quickly."
  },
  {
    id: "sub_002",
    studentId: "23ECE033",
    studentName: "Diya Nair",
    department: "ECE",
    year: "II Year",
    section: "B",
    submittedAt: "2026-03-14T10:45:00Z",
    phase: "phase1",
    ratings: {
      p1_q1: 4,
      p1_q2: 4,
      p1_q3: 3,
      p1_q4: 4,
      p1_q5: 4,
      p1_q6: 4,
      p1_q7: 3,
      p1_q8: 5,
      p1_q9: 3
    },
    remark: "The pace is mostly good. A short recap in the first 5 minutes would be useful."
  },
  {
    id: "sub_003",
    studentId: "22AIML018",
    studentName: "Rahul Verma",
    department: "AI&ML",
    year: "III Year",
    section: "A",
    submittedAt: "2026-03-14T12:18:00Z",
    phase: "phase2",
    ratings: {
      p2_q1: 5,
      p2_q2: 5,
      p2_q3: 4,
      p2_q4: 5,
      p2_q5: 5,
      p2_q6: 4,
      p2_q7: 5,
      p2_q8: 4,
      p2_q9: 5,
      p2_q10: 5,
      p2_q11: 2
    },
    remark: "Key strength: clear concept mapping. Improvement area: share rubrics before internals."
  },
  {
    id: "sub_004",
    studentId: "22MECH021",
    studentName: "Sana Fathima",
    department: "MECH",
    year: "III Year",
    section: "C",
    submittedAt: "2026-03-14T13:02:00Z",
    phase: "phase2",
    ratings: {
      p2_q1: 4,
      p2_q2: 4,
      p2_q3: 4,
      p2_q4: 4,
      p2_q5: 5,
      p2_q6: 4,
      p2_q7: 4,
      p2_q8: 4,
      p2_q9: 4,
      p2_q10: 5,
      p2_q11: 2
    },
    remark: "Strength: practical examples. Enhancement: include more previous exam question walkthroughs."
  }
];
