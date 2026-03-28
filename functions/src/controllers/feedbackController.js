// const {db} = require("../config/firebase");
// const { FieldValue } = require("firebase-admin/firestore");
// const {STUDENTS_COLLECTION, buildUserDoc} = require("../models/userModel");
// const {
//   FEEDBACK_COLLECTION,
//   buildFeedbackDoc,
// } = require("../models/feedbackModel");
// const {validateFeedbackPayload} = require("../validators/feedbackValidator");

// //////////////////////////////////////// SUBMITTING THE FEEDBACK /////////////////////////////////////////////

// async function submitFeedback(req, res) {
//   // Only require email, phase, ratings, remark
//   const { email, phase, ratings, remark } = req.body;
//   if (!email || typeof email !== "string" || !email.trim()) {
//     res.status(400).json({ message: "email is required and must be a string." });
//     return;
//   }
//   if (!phase || typeof phase !== "string" || !["phase1", "phase2"].includes(phase)) {
//     res.status(400).json({ message: "phase must be 'phase1' or 'phase2'." });
//     return;
//   }
//   if (!ratings || typeof ratings !== "object" || Array.isArray(ratings)) {
//     res.status(400).json({ message: "ratings is required and must be an object." });
//     return;
//   }
//   if (typeof remark !== "string" || !remark.trim()) {
//     res.status(400).json({ message: "remark is required and must be a string." });
//     return;
//   }

//   try {
//     // Store feedback in feedback/{email} with 'phase1' and 'phase2' fields
//     const feedbackDocRef = db.collection(FEEDBACK_COLLECTION).doc(email.trim());
//     const phaseDoc = {
//       ratings,
//       remark: remark.trim(),
//       updatedAt: FieldValue.serverTimestamp(),
//       createdAt: FieldValue.serverTimestamp(),
//     };

//     // Prepare completion flags
//     let completionFields = {};
//     if (phase === "phase1") {
//       completionFields.isPhase1Complete = true;
//     } else if (phase === "phase2") {
//       completionFields.isPhase2Complete = true;
//     }

//     // Set or update the document with the phase object, email, and completion flags
//     await feedbackDocRef.set({
//       email: email.trim(),
//       [phase]: phaseDoc,
//       ...completionFields,
//     }, { merge: true });

//     res.status(201).json({
//       message: "Feedback submitted successfully.",
//       submissionId: phase,
//     });
//   } catch (error) {
//     console.error("Failed to store feedback submission", error);
//     res.status(500).json({
//       message: "Failed to submit feedback. Please try again.",
//     });
//   }
// }

// // GET /feedback?email=...
// async function getFeedbackByEmail(req, res) {
//   const email = (req.query.email || '').trim();
//   if (!email) {
//     return res.status(400).json({ message: 'Missing email parameter.' });
//   }
//   try {
//     const feedbackDocRef = db.collection(FEEDBACK_COLLECTION).doc(email);
//     const docSnap = await feedbackDocRef.get();
//     if (!docSnap.exists) {
//       return res.status(404).json({ message: 'Feedback not found.' });
//     }
//     return res.status(200).json({ feedback: docSnap.data() });
//   } catch (error) {
//     console.error('Failed to fetch feedback', error);
//     return res.status(500).json({ message: 'Failed to fetch feedback.' });
//   }
// }

// module.exports = { submitFeedback, getFeedbackByEmail };