export type FeedbackQuestion = {
  id: string;
  text: string;
  reverseScored?: boolean;
};

export type FeedbackPhase = {
  id: "phase1" | "phase2";
  title: string;
  subtitle: string;
  helperText: string;
  textareaPrompt: string;
  questions: FeedbackQuestion[];
};

export const ratingLabels: Record<number, string> = {
  1: "Strongly Disagree",
  2: "Disagree",
  3: "Neutral",
  4: "Agree",
  5: "Strongly Agree",
};

export const feedbackPhases: FeedbackPhase[] = [
  {
    id: "phase1",
    title: "PHASE 1",
    subtitle: "Before Mid-I Examination (Week 5 or 6)",
    helperText: "Early academic pulse check",
    textareaPrompt:
      "Please provide any one suggestion for improving the teaching-learning process.",
    questions: [
      {
        id: "p1_q1",
        text: "The faculty demonstrates strong knowledge of the subject.",
      },
      {
        id: "p1_q2",
        text: "Concepts are explained clearly and logically.",
      },
      {
        id: "p1_q3",
        text: "The pace of teaching is appropriate for understanding.",
      },
      {
        id: "p1_q4",
        text: "Teaching methods help in improving understanding and problem-solving ability.",
      },
      {
        id: "p1_q5",
        text: "The faculty relates theory to practical / real-world applications.",
      },
      {
        id: "p1_q6",
        text: "The faculty encourages questions and participation.",
      },
      {
        id: "p1_q7",
        text: "The faculty is approachable for clearing doubts.",
      },
      {
        id: "p1_q8",
        text: "The faculty maintains punctuality and discipline.",
      },
      {
        id: "p1_q9",
        text: "The pace of teaching is too fast to follow.",
        reverseScored: true,
      },
    ],
  },
  {
    id: "phase2",
    title: "PHASE 2",
    subtitle: "After Mid-I Examination (Week 11 or 12)",
    helperText: "Post-mid review and refinement",
    textareaPrompt:
      "Kindly mention one key strength and one area for enhancement of the faculty.",
    questions: [
      {
        id: "p2_q1",
        text: "The faculty demonstrates strong knowledge of the subject.",
      },
      {
        id: "p2_q2",
        text: "Concepts are explained clearly and logically.",
      },
      {
        id: "p2_q3",
        text: "The pace of teaching is appropriate for understanding.",
      },
      {
        id: "p2_q4",
        text: "Teaching methods improve understanding and problem-solving ability.",
      },
      {
        id: "p2_q5",
        text: "The faculty relates theory to practical / real-world applications.",
      },
      {
        id: "p2_q6",
        text: "The faculty encourages questions and participation.",
      },
      {
        id: "p2_q7",
        text: "The faculty is approachable for clearing doubts.",
      },
      {
        id: "p2_q8",
        text: "The faculty evaluated internal answer scripts fairly and awarded marks appropriately.",
      },
      {
        id: "p2_q9",
        text: "There is noticeable improvement in teaching after Phase-1 feedback.",
      },
      {
        id: "p2_q10",
        text: "The faculty maintains punctuality and discipline.",
      },
      {
        id: "p2_q11",
        text: "Internal assessments were not evaluated properly.",
        reverseScored: true,
      },
    ],
  },
];
