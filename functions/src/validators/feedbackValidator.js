const ALLOWED_PHASES = new Set(["phase1", "phase2"]);

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

  if (!studentId || typeof studentId !== "string") {
    return "studentId is required and must be a string.";
  }

  if (!studentName || typeof studentName !== "string") {
    return "studentName is required and must be a string.";
  }

  if (!department || typeof department !== "string") {
    return "department is required and must be a string.";
  }

  if (!year || typeof year !== "string") {
    return "year is required and must be a string.";
  }

  if (!section || typeof section !== "string") {
    return "section is required and must be a string.";
  }

  if (!ALLOWED_PHASES.has(phase)) {
    return "phase must be either 'phase1' or 'phase2'.";
  }

  if (!ratings || typeof ratings !== "object" || Array.isArray(ratings)) {
    return "ratings is required and must be an object.";
  }

  const ratingValues = Object.values(ratings);
  if (!ratingValues.length) {
    return "ratings must include at least one question response.";
  }

  const invalidScore = ratingValues.some(
      (score) => typeof score !== "number" || score < 1 || score > 5,
  );

  if (invalidScore) {
    return "All rating values must be numbers between 1 and 5.";
  }

  if (typeof remark !== "string") {
    return "remark is required and must be a string.";
  }

  return null;
}

module.exports = {validateFeedbackPayload};
