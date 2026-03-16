const { FieldValue } = require("firebase-admin/firestore");

const STUDENTS_COLLECTION = "students";

/**
 * students/{studentId}
 * Represents a student who submits feedback.
 * Document ID is the studentId (e.g., 21ITR045)
 */
function buildStudentDoc(payload) {
  return {
    studentId: payload.studentId.trim(),
    name: payload.name ? payload.name.trim() : "",
    email: payload.email ? payload.email.trim() : "",
    branchId: payload.branchId ? payload.branchId.trim() : "",
    semester: payload.semester ? payload.semester : "",
    section: payload.section ? payload.section.trim() : "",
    rollNumber: payload.rollNumber ? payload.rollNumber.trim() : "",
    createdAt: FieldValue.serverTimestamp(),
  };
}

module.exports = { STUDENTS_COLLECTION, buildStudentDoc };

