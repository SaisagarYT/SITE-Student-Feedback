const BASE_URL = "https://feedback-mlxcleit7q-as.a.run.app";
/**
 * Submit feedback for a student (phase1 or phase2)
 * @param {object} feedbackData - { email, phase, ratings, remark }
 * @returns {Promise<object>} Backend response
 */
export async function submitStudentFeedback(payload, idToken) {
  const response = await fetch(`${BASE_URL}/api/student/submit-feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify(payload)
  });
  return response.json();
}

/**
 * Fetch feedback status for a student by courseId (and optionally idToken or studentId)
 * @param {string} courseId - Course ID to check feedback status for
 * @param {string} [idToken] - Optional Firebase ID token for authentication
 * @param {string} [studentId] - Optional studentId if available
 * @returns {Promise<object|null>} Feedback status or null if not found
 */
export async function getStudentFeedbackByCourse(courseId, idToken, studentId) {
  let url = `${BASE_URL}/api/student/feedback-status/${encodeURIComponent(courseId)}`;
  if (studentId) {
    url += `?studentId=${encodeURIComponent(studentId)}`;
  }
  const headers = { "Content-Type": "application/json" };
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
  const response = await fetch(url, { headers });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch feedback status');
  return await response.json();
}
/**
 * Fetch all student feedbacks for admin dashboard (phase1 and phase2 per student)
 * @returns {Promise<Array>} Array of feedbacks [{ email, phase1, phase2 }]
 */
export async function getAllStudentFeedbacks() {
  const response = await fetch(`${BASE_URL}/api/admin/feedbacks`);
  if (!response.ok) throw new Error('Failed to fetch feedbacks');
  const data = await response.json();
  return data.feedbacks;
}
/**
 * Get admin dashboard stats (total submissions, phase counts, average rating)
 * @returns {Promise<object>} Backend response
 */
export async function getAdminDashboardStats() {
  const response = await fetch(`${BASE_URL}/api/admin/dashboard-stats`);
  return response.json();
}
/**
 * Authenticate admin with Google ID token.
 * @param {string} idToken - Firebase ID token from Google sign-in
 * @returns {Promise<object>} Backend response
 */
export async function authenticateAdmin(idToken) {
  const response = await fetch(`${BASE_URL}/api/admin/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  return response.json();
}
/**
 * Logout student by calling backend (if needed for session cleanup).
 * @param {string} idToken - Firebase ID token from Google sign-in
 * @returns {Promise<object>} Backend response
 */
export async function logoutStudent(idToken) {
  const response = await fetch(`${BASE_URL}/api/student/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  return response.json();
}

/**
 * Logout admin by calling backend (if needed for session cleanup).
 * @param {string} idToken - Firebase ID token from Google sign-in
 * @returns {Promise<object>} Backend response
 */
export async function logoutAdmin(idToken) {
  const response = await fetch(`${BASE_URL}/api/admin/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  return response.json();
}

/**
 * Login student with Google ID token.
 * @param {string} idToken - Firebase ID token from Google sign-in
 * @returns {Promise<object>} Backend response
 */
export async function loginStudent(idToken) {
  const response = await fetch(`${BASE_URL}/api/student/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  return response.json();
}

/**
 * Fetch courses for the authenticated student
 * @param {string} idToken - Firebase ID token from Google sign-in
 * @returns {Promise<Array>} Array of courses [{ courseId, courseName, facultyId }]
 */
export async function getStudentCourses(idToken) {
  const response = await fetch(`${BASE_URL}/api/student/courses`, {
    headers: {
      "Authorization": `Bearer ${idToken}`
    }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }
  return response.json();
}

/**
 * Fetch faculty info for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<object>} Faculty info { facultyId, facultyName, subjectId, designation }
 */
export async function getCourseFaculty(courseId) {
  const res = await fetch(`${BASE_URL}/api/student/course/${courseId}/faculty`);
  if (!res.ok) {
    throw new Error("Failed to fetch faculty");
  }
  return res.json();
}
