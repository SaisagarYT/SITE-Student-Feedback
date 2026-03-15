const {FieldValue} = require("firebase-admin/firestore");

const STUDENTS_COLLECTION = "students";

/**
 * students/{email}
 * Stores student identity and profile details.
 * Document ID is the email so upsert with merge avoids duplicates.
 */
function buildUserDoc(payload) {
  return {
    email: payload.email.trim(),
    name: payload.name ? payload.name.trim() : "",
    department: payload.department ? payload.department.trim() : "",
    year: payload.year ? payload.year.trim() : "",
    section: payload.section ? payload.section.trim() : "",
    profileImage: payload.profileImage || "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

module.exports = {STUDENTS_COLLECTION, buildUserDoc};
