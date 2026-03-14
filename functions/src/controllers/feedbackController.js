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
    const feedbackCollectionRef = db.collection(FEEDBACK_COLLECTION);
    const feedbackRef = feedbackCollectionRef.doc();
    // Store phase as subcollection under feedback doc, use studentId as doc ID
    const feedbackPhaseRef = feedbackRef.collection(req.body.phase).doc(req.body.studentId);

    // Main feedback doc: no ratings, just metadata (no remark)
    const feedbackDoc = {
      feedbackId: feedbackRef.id,
      userId: userRef.id,
      studentId: userRef.id,
      phase: req.body.phase,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Subcollection doc: only ratings and remark
    const phaseDoc = {
      feedbackId: feedbackRef.id,
      ratings: req.body.ratings,
      remark: req.body.remark.trim(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

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
    batch.set(feedbackRef, feedbackDoc);
    batch.set(feedbackPhaseRef, phaseDoc);
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
