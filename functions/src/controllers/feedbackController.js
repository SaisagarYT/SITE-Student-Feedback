const {db} = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");
const {STUDENTS_COLLECTION, buildUserDoc} = require("../models/userModel");
const {
  FEEDBACK_COLLECTION,
  buildFeedbackDoc,
} = require("../models/feedbackModel");
const {validateFeedbackPayload} = require("../validators/feedbackValidator");

//////////////////////////////////////// SUBMITTING THE FEEDBACK /////////////////////////////////////////////

async function submitFeedback(req, res) {
  const validationError = validateFeedbackPayload(req.body);
  if (validationError) {
    res.status(400).json({message: validationError});
    return;
  }

  try {
    // 1. Upsert student profile into `students` collection
    const userRef = db.collection(STUDENTS_COLLECTION).doc(req.body.studentId.trim());

    // Use studentId as feedback doc ID
    const feedbackRef = db.collection(FEEDBACK_COLLECTION).doc(req.body.studentId.trim());

    // Prepare the phase data
    const phaseDoc = {
      ratings: req.body.ratings,
      remark: req.body.remark.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Prepare feedback doc update (merge phase into phases object)
    const feedbackDocUpdate = {
      userId: userRef.id,
      studentId: userRef.id,
      updatedAt: FieldValue.serverTimestamp(),
      [`phases.${req.body.phase}`]: phaseDoc,
    };

    // If creating for the first time, add createdAt
    const feedbackSnap = await feedbackRef.get();
    if (!feedbackSnap.exists) {
      feedbackDocUpdate.createdAt = FieldValue.serverTimestamp();
    }

    // Get user doc to update phaseCount

    const studentSnap = await userRef.get();
    let phaseCount = 1;
    if (studentSnap.exists) {
      const studentData = studentSnap.data();
      // If phase1 and phase2 both exist, count = 2; else 1
      const submittedPhases = studentData.submittedPhases || [];
      if (!submittedPhases.includes(req.body.phase)) {
        phaseCount = (submittedPhases.length || 0) + 1;
      } else {
        phaseCount = submittedPhases.length;
      }
    }

    // Update student doc with phaseCount and submittedPhases, and always include email if present
    const studentDoc = {
      ...buildUserDoc(req.body),
      ...(req.body.email ? { email: req.body.email } : {}),
      phaseCount,
      submittedPhases: FieldValue.arrayUnion(req.body.phase),
      updatedAt: FieldValue.serverTimestamp(),
    };


    const batch = db.batch();
    batch.set(userRef, studentDoc, {merge: true});
    batch.set(feedbackRef, feedbackDocUpdate, {merge: true});
    await batch.commit();

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
