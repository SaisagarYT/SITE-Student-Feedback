const express = require("express");
const { getAdminReport, loginAdmin, logoutAdmin, getFacultyPerformance, getFacultyDetail, getCourseAnalytics, verifyAdmin, setFeedbackReportDates, getFeedbackReportDates, listFeedbackReportYears } = require("../controllers/adminController");

const adminRouter = express.Router();
// List all feedbackreport years and their semesters with data
adminRouter.get("/feedbackreport/years", verifyAdmin, listFeedbackReportYears);

// Admin login endpoint
adminRouter.post("/login", loginAdmin);

// Admin logout endpoint
adminRouter.post("/logout", logoutAdmin);

// FINAL API: report endpoint only (protected)
adminRouter.get("/report", verifyAdmin, getAdminReport);


// Set feedback phase dates for a semester in a given academic year
adminRouter.post("/feedbackreport/dates", setFeedbackReportDates);

// Get feedback phase dates for a semester in a given academic year
adminRouter.get("/feedbackreport/dates", verifyAdmin, getFeedbackReportDates);

module.exports = adminRouter;
