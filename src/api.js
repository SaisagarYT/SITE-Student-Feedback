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
// src/api.js

const BASE_URL = "https://feedback-mlxcleit7q-as.a.run.app";

/**
 * Authenticate student with Google ID token, and optionally register with details.
 * @param {string} idToken - Firebase ID token from Google sign-in
 * @param {object} [studentDetails] - Optional student details for registration
 * @returns {Promise<object>} Backend response
 */
export async function authenticateStudent(idToken, studentDetails) {
  const response = await fetch(`${BASE_URL}/api/student/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentDetails ? { idToken, userDetails: studentDetails } : { idToken }),
  });
  return response.json();
}
