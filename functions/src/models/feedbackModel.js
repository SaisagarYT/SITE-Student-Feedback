const {FieldValue} = require("firebase-admin/firestore");

const FEEDBACK_COLLECTION = "feedback";

/**
 * feedback/{feedbackId}
 * Stores the actual phase ratings and student remark.
 */
function buildFeedbackDoc(userId, payload) {
  return {
    userId,
    studentId: payload.studentId.trim(),
    phase: payload.phase,
    ratings: payload.ratings,
    remark: payload.remark.trim(),
    source: "web",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {FEEDBACK_COLLECTION, buildFeedbackDoc};
