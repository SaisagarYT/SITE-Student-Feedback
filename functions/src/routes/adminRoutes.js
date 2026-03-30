const express = require("express");
const { getAdminReport, loginAdmin, logoutAdmin, getFacultyPerformance, getFacultyDetail, getCourseAnalytics, verifyAdmin } = require("../controllers/adminController");

const adminRouter = express.Router();

// Admin login endpoint
adminRouter.post("/login", loginAdmin);

// Admin logout endpoint
adminRouter.post("/logout", logoutAdmin);

// FINAL API: report endpoint only (protected)
adminRouter.get("/report", verifyAdmin, getAdminReport);

module.exports = adminRouter;
