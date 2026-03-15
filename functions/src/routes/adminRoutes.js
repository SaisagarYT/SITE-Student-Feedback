const express = require("express");
const { authenticateAdmin } = require("../controllers/adminController");

const adminRouter = express.Router();

// POST /api/admin/authenticate
adminRouter.post("/authenticate", authenticateAdmin);

module.exports = { adminRouter };
