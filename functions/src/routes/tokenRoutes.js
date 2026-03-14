const express = require("express");
const { verifyToken } = require("../controllers/tokenController");

const router = express.Router();

// POST /api/verify-token
router.post("/verify-token", verifyToken);

module.exports = { tokenRouter: router };
