const express = require("express");
const { getAdminReport, loginAdmin, logoutAdmin, getFacultyPerformance, getFacultyDetail, getCourseAnalytics } = require("../controllers/adminController");

const adminRouter = express.Router();

// FINAL API: report endpoint only
adminRouter.get("/report", getAdminReport);

module.exports = adminRouter;
