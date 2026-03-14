const {FieldValue} = require("firebase-admin/firestore");

const USERS_COLLECTION = "users";

/**
 * users/{studentId}
 * Stores student identity and profile details.
 * Document ID is the studentId so upsert with merge avoids duplicates.
 */
function buildUserDoc(payload) {
  return {
    studentId: payload.studentId.trim(),
    studentName: payload.studentName.trim(),
    department: payload.department.trim(),
    year: payload.year.trim(),
    section: payload.section.trim(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {USERS_COLLECTION, buildUserDoc};
