const express = require("express");
const { authenticateAdmin } = require("../controllers/adminController");
const { getDashboardStats } = require("../controllers/adminStatsController");

const adminRouter = express.Router();


// POST /api/admin/authenticate
adminRouter.post("/authenticate", authenticateAdmin);

// GET /api/admin/dashboard-stats
adminRouter.get("/dashboard-stats", getDashboardStats);

module.exports = { adminRouter };
