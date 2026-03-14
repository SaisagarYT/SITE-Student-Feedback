const express = require("express");
const { authenticateStudent, loginStudent } = require("../controllers/studentController");

const router = express.Router();

// POST /api/student/authenticate
router.post("/authenticate", authenticateStudent);

// POST /api/student/login
router.post("/login", loginStudent);


module.exports = { studentRouter: router };
