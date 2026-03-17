const express = require("express");
const { getAllFaculty } = require("../controllers/facultyController");

const router = express.Router();

// GET /api/faculty
router.get("/", getAllFaculty);

module.exports = router;
