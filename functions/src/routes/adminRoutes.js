const express = require("express");
const { getAdminReport, getStudentFeedbackDetails, normalizeCoursesSchema, loginAdmin, logoutAdmin, getFacultyPerformance, getFacultyDetail, getCourseAnalytics, verifyAdmin, setFeedbackReportDates, getFeedbackReportDates, listFeedbackReportYears, getPhaseActivation, setPhaseActivation, getStudentsList, getCourseFacultyPairs } = require("../controllers/adminController");

const adminRouter = express.Router();
// List all feedbackreport years and their semesters with data
adminRouter.get("/feedbackreport/years", verifyAdmin, listFeedbackReportYears);

// Admin login endpoint
adminRouter.post("/login", loginAdmin);

// Admin logout endpoint
adminRouter.post("/logout", logoutAdmin);

// Phase 2 activation endpoints
// GET is public (students/frontend may read), POST requires admin
adminRouter.get("/phase-activation", getPhaseActivation);
adminRouter.post("/phase-activation", verifyAdmin, setPhaseActivation);

// FINAL API: report endpoint only (protected)
adminRouter.get("/report", verifyAdmin, getAdminReport);

// Student feedback details endpoint (protected)
adminRouter.get("/student-feedback-details", verifyAdmin, getStudentFeedbackDetails);

// Schema normalization endpoint (protected admin only)
adminRouter.post("/normalize-courses", verifyAdmin, normalizeCoursesSchema);

// Fetch students list for filters (protected admin only)
adminRouter.get("/students", verifyAdmin, getStudentsList);

// Get course-faculty pairs for a branch/semester/section (protected admin only)
adminRouter.get("/course-faculty-pairs", verifyAdmin, getCourseFacultyPairs);

// Set feedback phase dates for a semester in a given academic year
adminRouter.post("/feedbackreport/dates", setFeedbackReportDates);

// Get feedback phase dates for a semester in a given academic year
adminRouter.get("/feedbackreport/dates", verifyAdmin, getFeedbackReportDates);

module.exports = adminRouter;
