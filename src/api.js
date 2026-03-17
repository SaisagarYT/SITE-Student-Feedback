const BASE_URL = "https://feedback-mlxcleit7q-as.a.run.app";
/**
 * Submit feedback for a student (phase1 or phase2)
 * @param {object} feedbackData - { email, phase, ratings, remark }
 * @returns {Promise<object>} Backend response
 */
export async function submitStudentFeedback(feedbackData) {
  const response = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedbackData),
  });
  return response.json();
}

/**
 * Fetch feedback for a student by email
 * @param {string} email - Student's email
 * @returns {Promise<object|null>} Feedback document or null if not found
 */
export async function getStudentFeedbackByEmail(email) {
  const response = await fetch(`${BASE_URL}/feedback?email=${encodeURIComponent(email)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch feedback');
  const data = await response.json();
  // ...removed debug log...
  return data.feedback;
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
