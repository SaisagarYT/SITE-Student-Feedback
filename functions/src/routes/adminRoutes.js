const { getPhaseActivation, setPhaseActivation } = require("../controllers/adminController");
// Global phase activation endpoints
const express = require("express");
const { getDashboardOverview, loginAdmin, logoutAdmin, getFacultyPerformance, getFacultyDetail, getCourseAnalytics } = require("../controllers/adminController");

const adminRouter = express.Router();

adminRouter.get("/phase-activation", getPhaseActivation);

adminRouter.post("/phase-activation", setPhaseActivation);

// Course analytics endpoint
adminRouter.get("/course-analytics", getCourseAnalytics);

// Admin logout endpoint (similar to student logout)
adminRouter.post("/logout", logoutAdmin);

// Admin login endpoint (similar to student login)
adminRouter.post("/login", loginAdmin);

// Dashboard overview analytics endpoint
adminRouter.get("/dashboard", getDashboardOverview);

// Faculty performance analytics endpoint
adminRouter.get("/faculty-performance", getFacultyPerformance);

// Faculty detail analytics endpoint
adminRouter.get("/faculty-detail/:facultyId", getFacultyDetail);

module.exports = adminRouter;
