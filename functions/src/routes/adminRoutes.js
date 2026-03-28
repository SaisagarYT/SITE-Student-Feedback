const { getPhaseActivation, setPhaseActivation } = require("../controllers/adminController");
// Global phase activation endpoints
const express = require("express");
const { getAdminDashboard, loginAdmin, logoutAdmin, getFacultyPerformance, getFacultyDetail, getCourseAnalytics } = require("../controllers/adminController");

const adminRouter = express.Router();


// Dashboard overview analytics endpoint
adminRouter.get("/dashboard", getAdminDashboard);

module.exports = adminRouter;
