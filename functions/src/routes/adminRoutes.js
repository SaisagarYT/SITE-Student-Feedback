const express = require("express");
const { getAdminReport, loginAdmin, logoutAdmin, getFacultyPerformance, getFacultyDetail, getCourseAnalytics } = require("../controllers/adminController");

const adminRouter = express.Router();

// Admin login endpoint
adminRouter.post("/login", loginAdmin);


// Admin logout endpoint
adminRouter.post("/logout", logoutAdmin);

// FINAL API: report endpoint only
adminRouter.get("/report", getAdminReport);

module.exports = adminRouter;
