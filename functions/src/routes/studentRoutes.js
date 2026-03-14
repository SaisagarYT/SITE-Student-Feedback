const express = require("express");
const { authenticateStudent } = require("../controllers/studentController");

const router = express.Router();


// POST /api/student/authenticate
router.post("/authenticate", authenticateStudent);


module.exports = { studentRouter: router };
