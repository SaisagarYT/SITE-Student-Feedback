const express = require("express");
const { loginStudent, getStudentCourses, getCourseFaculty, checkFeedbackStatus, submitFeedback } = require("../controllers/studentController");


const router = express.Router();

// POST /api/student/submit-feedback
router.post("/submit-feedback", submitFeedback);

// GET /api/student/feedback-status/:courseId
router.get("/feedback-status/:courseId/:facultyId", checkFeedbackStatus);

// GET /api/student/course/:courseId/faculty
router.get("/course/:courseId/faculty", getCourseFaculty);

// GET /api/student/courses
router.get("/courses", getStudentCourses);


// POST /api/student/login
router.post("/login", loginStudent);

module.exports = router;
