const express = require("express");
const { authenticateAdmin, getAllStudentFeedbacks, logoutAdmin } = require("../controllers/adminController");
// POST /api/admin/logout
const { getDashboardStats } = require("../controllers/adminStatsController");

const adminRouter = express.Router();


adminRouter.post("/logout", logoutAdmin);
// POST /api/admin/authenticate
adminRouter.post("/authenticate", authenticateAdmin);

// GET /api/admin/dashboard-stats
adminRouter.get("/dashboard-stats", getDashboardStats);

// GET /api/admin/feedbacks
adminRouter.get("/feedbacks", getAllStudentFeedbacks);

module.exports = adminRouter;
