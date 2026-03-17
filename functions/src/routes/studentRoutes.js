const express = require("express");
const { authenticateStudent, loginStudent, getStudentCourses, getCourseFaculty, checkFeedbackStatus, submitFeedback } = require("../controllers/studentController");

// POST /api/student/submit-feedback

// GET /api/student/feedback-status/:courseId

// GET /api/student/course/:courseId/faculty

// GET /api/student/courses

const router = express.Router();
router.post("/submit-feedback", submitFeedback);

router.get("/feedback-status/:courseId", checkFeedbackStatus);

router.get("/course/:courseId/faculty", getCourseFaculty);

router.get("/courses", getStudentCourses);


// POST /api/student/login
router.post("/login", loginStudent);

module.exports = router;
