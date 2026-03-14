
// Directly mirror the frontend's feedbackPhases config
const FEEDBACK_PHASES = [
  {
    id: "phase1",
    questionIds: [
      "p1_q1",
      "p1_q2",
      "p1_q3",
      "p1_q4",
      "p1_q5",
      "p1_q6",
      "p1_q7",
      "p1_q8",
      "p1_q9",
    ],
  },
  {
    id: "phase2",
    questionIds: [
      "p2_q1",
      "p2_q2",
      "p2_q3",
      "p2_q4",
      "p2_q5",
      "p2_q6",
      "p2_q7",
      "p2_q8",
      "p2_q9",
      "p2_q10",
      "p2_q11",
    ],
  },
];

const ALLOWED_PHASES = new Set(FEEDBACK_PHASES.map(phase => phase.id));

function validateFeedbackPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Request body is required.";
  }

  const {
    studentId,
    studentName,
    department,
    year,
    section,
    phase,
    ratings,
    remark,
  } = payload;

  if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
    return "studentId is required and must be a string.";
  }

  if (!studentName || typeof studentName !== "string" || !studentName.trim()) {
    return "studentName is required and must be a string.";
  }

  if (!department || typeof department !== "string" || !department.trim()) {
    return "department is required and must be a string.";
  }

  if (!year || typeof year !== "string" || !year.trim()) {
    return "year is required and must be a string.";
  }

  if (!section || typeof section !== "string" || !section.trim()) {
    return "section is required and must be a string.";
  }

  if (!ALLOWED_PHASES.has(phase)) {
    return "phase must be either 'phase1' or 'phase2'.";
  }

  const phaseConfig = FEEDBACK_PHASES.find(p => p.id === phase);
  if (!phaseConfig) {
    return "Invalid phase configuration.";
  }

  if (!ratings || typeof ratings !== "object" || Array.isArray(ratings)) {
    return "ratings is required and must be an object.";
  }

  const ratingKeys = Object.keys(ratings);
  if (!ratingKeys.length) {
    return "ratings must include at least one question response.";
  }

  const missingQuestionIds = phaseConfig.questionIds.filter(
      (questionId) => !(questionId in ratings),
  );
  if (missingQuestionIds.length) {
    return `ratings is missing required questions: ${missingQuestionIds.join(", ")}.`;
  }

  const unexpectedQuestionIds = ratingKeys.filter(
      (questionId) => !phaseConfig.questionIds.includes(questionId),
  );
  if (unexpectedQuestionIds.length) {
    return `ratings contains unexpected questions for ${phase}: ${unexpectedQuestionIds.join(", ")}.`;
  }

  const ratingValues = Object.values(ratings);

  const invalidScore = ratingValues.some(
      (score) => typeof score !== "number" || score < 1 || score > 5,
  );

  if (invalidScore) {
    return "All rating values must be numbers between 1 and 5.";
  }

  if (typeof remark !== "string" || !remark.trim()) {
    return "remark is required and must be a string.";
  }

  return null;
}

module.exports = {validateFeedbackPayload};
