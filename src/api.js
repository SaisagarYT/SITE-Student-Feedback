/**
 * List all feedbackreport years and their semesters with data (admin)
 * @returns {Promise<Array>} Array of { year, semesters: [{ semester, ...data }] }
 */
export async function getFeedbackReportYears() {
  const response = await fetch(`${BASE_URL}/api/admin/feedbackreport/years`, {
    credentials: "include"
  });
  if (!response.ok) throw new Error("Failed to fetch feedback report years");
  return response.json();
}
// Unified admin dashboard analytics API fetcher
// Use this for all dashboard analytics in the frontend

// Correct admin report fetcher for dashboard table
export async function getAdminReport(params) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${BASE_URL}/api/admin/report?${query}`, {
    credentials: "include"
  });
  if (!response.ok) throw new Error("Failed to fetch report");
  return response.json();
}
/**
 * Fetch the global phase2Active flag (admin or student)
 * @returns {Promise<boolean>} true if phase2 is active, false otherwise
 */
export async function getPhase2Active() {
  const response = await fetch(`${BASE_URL}/api/admin/phase-activation`, {
    credentials: "include"
  });
  if (!response.ok) throw new Error("Failed to fetch phase2Active");
  const data = await response.json();
  return !!data.phase2Active;
}
/**
 * Get course analytics (admin)
 * @param {object} filters - Optional filters: { courseId, facultyId }
 * @returns {Promise<Array>} Array of course analytics objects
 */
export async function getCourseAnalytics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.courseId) params.append('courseId', filters.courseId);
  if (filters.facultyId) params.append('facultyId', filters.facultyId);
  if (filters.branch) params.append('branch', filters.branch);
  if (filters.semester) params.append('semester', filters.semester);
  if (filters.facultyName) params.append('facultyName', filters.facultyName);
  const url = `${BASE_URL}/api/admin/course-analytics${params.toString() ? '?' + params.toString() : ''}`;
  // Removed debug log as requested
  const response = await fetch(url, {
    credentials: "include"
  });
  if (!response.ok) {
    console.error('[getCourseAnalytics] 404 or error:', response.status, response.statusText, url);
    throw new Error('Failed to fetch course analytics');
  }
  return response.json();
}
/**
 * Get faculty performance analytics (admin)
 * @returns {Promise<Array>} Array of faculty performance objects
 */
export async function getFacultyPerformance() {
  const response = await fetch(`${BASE_URL}/api/admin/faculty-performance`, {
    credentials: "include"
  });
  if (!response.ok) throw new Error('Failed to fetch faculty performance');
  return response.json();
}

/**
 * Get faculty detail analytics (admin)
 * @param {string} facultyId - Faculty ID
 * @returns {Promise<object>} Faculty detail analytics
 */
export async function getFacultyDetail(facultyId) {
  const response = await fetch(`${BASE_URL}/api/admin/faculty-detail/${encodeURIComponent(facultyId)}`, {
    credentials: "include"
  });
  if (!response.ok) throw new Error('Failed to fetch faculty detail');
  return response.json();
}
/**
 * Logout admin by calling backend (stateless, for session cleanup)
 * @param {string} idToken - Firebase ID token from Google sign-in
 * @returns {Promise<object>} Backend response
 */
export async function logoutAdmin(idToken) {
  const response = await fetch(`${BASE_URL}/api/admin/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });
  return response.json();
}
/**
 * Login admin with Google ID token.
 * @param {string} idToken - Firebase ID token from Google sign-in
 * @returns {Promise<object>} Backend response
 */
export async function loginAdmin(idToken) {
  const response = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });
  return response.json();
}
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
/**
 * Fetch feedback status for a student by courseId and facultyId
 * @param {string} courseId - Course ID to check feedback status for
 * @param {string} facultyId - Faculty ID to check feedback status for
 * @param {string} idToken - Firebase ID token for authentication
 * @returns {Promise<object|null>} Feedback status or null if not found
 */
export async function getStudentFeedbackByCourse(courseId, facultyId, idToken) {
  const url = `${BASE_URL}/api/student/feedback-status/${encodeURIComponent(courseId)}/${encodeURIComponent(facultyId)}`;
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

/**
 * Get admin dashboard overview analytics (new backend)
 * @returns {Promise<object>} Backend response
 */


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

/**
 * Set feedback phase dates for a semester in a given academic year (admin)
 * @param {object} params - { academicYear, semester, phase1Date, phase2Date }
 * @returns {Promise<object>} Backend response
 */
export async function setFeedbackReportDates(params) {
  const response = await fetch(`${BASE_URL}/api/admin/feedbackreport/dates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error("Failed to set feedback report dates");
  return response.json();
}

/**
 * Get feedback phase dates for a semester in a given academic year (admin)
 * @param {object} params - { academicYear, semester }
 * @returns {Promise<object>} Backend response
 */
export async function getFeedbackReportDates(params) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${BASE_URL}/api/admin/feedbackreport/dates?${query}`, {
    credentials: "include"
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to get feedback report dates");
  return response.json();
}
