const {db} = require("../config/firebase");
const {USERS_COLLECTION, buildUserDoc} = require("../models/userModel");
const {
  FEEDBACK_COLLECTION,
  buildFeedbackDoc,
} = require("../models/feedbackModel");
const {validateFeedbackPayload} = require("../validators/feedbackValidator");

async function submitFeedback(req, res) {
  const validationError = validateFeedbackPayload(req.body);
  if (validationError) {
    res.status(400).json({message: validationError});
    return;
  }

  try {
    // 1. Upsert student profile into `users` collection
    const userRef = db
        .collection(USERS_COLLECTION)
        .doc(req.body.studentId.trim());
    await userRef.set(buildUserDoc(req.body), {merge: true});

    // 2. Write feedback ratings/remark into `feedback` collection
    const feedbackRef = await db
        .collection(FEEDBACK_COLLECTION)
        .add(buildFeedbackDoc(userRef.id, req.body));

    res.status(201).json({
      message: "Feedback submitted successfully.",
      submissionId: feedbackRef.id,
    });
  } catch (error) {
    console.error("Failed to store feedback submission", error);
    res.status(500).json({
      message: "Failed to submit feedback. Please try again.",
    });
  }
}

module.exports = {submitFeedback};
