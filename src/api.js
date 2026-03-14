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
