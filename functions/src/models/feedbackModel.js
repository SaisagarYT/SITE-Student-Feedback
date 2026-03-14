const {FieldValue} = require("firebase-admin/firestore");

const FEEDBACK_COLLECTION = "feedback";


function buildFeedbackDoc(userId, payload) {
  return {
    userId,
    studentId: userId,
    phase: payload.phase,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {
  FEEDBACK_COLLECTION,
  buildFeedbackDoc,
};
