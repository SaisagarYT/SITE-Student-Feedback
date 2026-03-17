const { getAuth } = require("firebase-admin/auth");
const { db } = require("../config/firebase");
/**
 * POST /api/student/submit-feedback
 * Submits feedback for a course.
 * Expects idToken in header or body, courseId, facultyId, phase1, phase2 in body.
 */
exports.submitFeedback = async (req, res) => {
  try {
    const idToken = req.headers["authorization"]?.replace("Bearer ", "") || req.body.idToken;
    const { courseId, facultyId, phase1, phase2 } = req.body;
    if (!idToken || !courseId || !facultyId || !phase1 || !phase2) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Get studentId from token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const email = decodedToken.email;
    if (!email) return res.status(400).json({ error: "Invalid token: no email" });
    const studentSnap = await db.collection("students").where("email", "==", email).limit(1).get();
    if (studentSnap.empty) return res.status(404).json({ error: "Student not found" });
    const studentId = studentSnap.docs[0].data().studentId;
    if (!studentId) return res.status(400).json({ error: "StudentId not found" });

    // Generate feedbackId
    const feedbackId = `${studentId}_${courseId}`;

    // Check duplicate
    const feedbackDoc = await db.collection("feedback").doc(feedbackId).get();
    if (feedbackDoc.exists) {
      return res.status(409).json({ error: "Feedback already submitted for this course" });
    }

    // Validate answers (basic: all questions present and are numbers)
    const validatePhase = (phase, count) => {
      if (!phase || typeof phase !== "object") return false;
      for (let i = 1; i <= count; i++) {
        const key = `q${i}`;
        if (!(key in phase) || typeof phase[key] !== "number") return false;
      }
      return true;
    };
    if (!validatePhase(phase1, 9) || !validatePhase(phase2, 11)) {
      return res.status(400).json({ error: "Invalid answers format" });
    }

    // Attach remarks to each phase if provided
    const { phase1Remark, phase2Remark } = req.body;
    const phase1WithRemark = { ...phase1 };
    const phase2WithRemark = { ...phase2 };
    if (typeof phase1Remark === "string") phase1WithRemark.remark = phase1Remark;
    if (typeof phase2Remark === "string") phase2WithRemark.remark = phase2Remark;

    // Also store remarks as top-level fields for direct access (optional, for compatibility with frontend payload)
    const feedbackData = {
      feedbackId,
      studentId,
      courseId,
      facultyId,
      phase1: phase1WithRemark,
      phase2: phase2WithRemark,
      phase1Remark: typeof phase1Remark === "string" ? phase1Remark : undefined,
      phase2Remark: typeof phase2Remark === "string" ? phase2Remark : undefined,
      submittedAt: new Date().toISOString()
    };
    await db.collection("feedback").doc(feedbackId).set(feedbackData);
    return res.status(201).json({ submitted: true });
  } catch (error) {
    console.error("Submit feedback error:", error);
    return res.status(500).json({ error: error.message });
  }
};
/**
 * GET /api/student/feedback-status/:courseId
 * Checks if student already submitted feedback for a course.
 * Expects studentId in query or idToken in header/query.
 */
exports.checkFeedbackStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const idToken = req.headers["authorization"]?.replace("Bearer ", "") || req.query.idToken;
    const studentId = req.query.studentId;
    let resolvedStudentId;

    if (!courseId) {
      return res.status(400).json({ error: "Missing courseId parameter" });
    }

    if (studentId) {
      resolvedStudentId = studentId;
    } else if (idToken) {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const email = decodedToken.email;
      if (!email) return res.status(400).json({ error: "Invalid token: no email" });
      // Find student by email
      const studentSnap = await db.collection("students").where("email", "==", email).limit(1).get();
      if (studentSnap.empty) return res.status(404).json({ error: "Student not found" });
      resolvedStudentId = studentSnap.docs[0].data().studentId;
    } else {
      return res.status(400).json({ error: "Missing studentId or idToken" });
    }

    if (!resolvedStudentId) {
      return res.status(400).json({ error: "StudentId not found" });
    }

    const feedbackId = `${resolvedStudentId}_${courseId}`;
    const feedbackDoc = await db.collection("feedback").doc(feedbackId).get();
    if (!feedbackDoc.exists) {
      return res.json({ submitted: false });
    }
    const feedback = feedbackDoc.data();
    // Return phase data and remarks for frontend population
    return res.json({
      submitted: true,
      phase1: feedback.phase1 || null,
      phase2: feedback.phase2 || null,
      phase1Remark: feedback.phase1Remark || (feedback.phase1 && feedback.phase1.remark) || "",
      phase2Remark: feedback.phase2Remark || (feedback.phase2 && feedback.phase2.remark) || "",
    });
  } catch (error) {
    console.error("Check feedback status error:", error);
    return res.status(500).json({ error: error.message });
  }
};
/**
 * GET /api/student/course/:courseId/faculty
 * Returns faculty details for a selected course.
 */
exports.getCourseFaculty = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId) {
      return res.status(400).json({ error: "Missing courseId parameter" });
    }
    // Get course document
    const courseSnap = await db.collection("courses").where("courseId", "==", courseId).limit(1).get();
    if (courseSnap.empty) {
      return res.status(404).json({ error: "Course not found" });
    }
    const courseData = courseSnap.docs[0].data();
    const facultyId = courseData.facultyId;
    if (!facultyId) {
      return res.status(404).json({ error: "Faculty not assigned to this course" });
    }
    // Get faculty document
    const facultySnap = await db.collection("faculties").where("facultyId", "==", facultyId).limit(1).get();
    if (facultySnap.empty) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    const facultyData = facultySnap.docs[0].data();
    // Build response
    const response = {
      facultyId: facultyData.facultyId,
      facultyName: facultyData.facultyName,
      subjectId: courseData.courseId,
      designation: facultyData.designation || ""
    };
    return res.json(response);
  } catch (error) {
    console.error("Get course faculty error:", error);
    return res.status(500).json({ error: error.message });
  }
};
/**
 * GET /api/student/courses
 * Returns courses for the student's branch and semester.
 * Expects idToken in query or header, or studentId in query.
 */
exports.getStudentCourses = async (req, res) => {
  try {
    // Accept idToken in header or query, or studentId in query
    const idToken = req.headers["authorization"]?.replace("Bearer ", "") || req.query.idToken;
    const studentId = req.query.studentId;
    let studentProfile;

    if (idToken) {
      // Auth via idToken
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const email = decodedToken.email;
      if (!email) return res.status(400).json({ error: "Invalid token: no email" });
      // Find student by email
      const studentSnap = await db.collection("students").where("email", "==", email).limit(1).get();
      if (studentSnap.empty) return res.status(404).json({ error: "Student not found" });
      studentProfile = studentSnap.docs[0].data();
    } else if (studentId) {
      // Auth via studentId
      const studentSnap = await db.collection("students").where("studentId", "==", studentId).limit(1).get();
      if (studentSnap.empty) return res.status(404).json({ error: "Student not found" });
      studentProfile = studentSnap.docs[0].data();
    } else {
      return res.status(400).json({ error: "Missing idToken or studentId" });
    }

    const { branchId, semester } = studentProfile;
    if (!branchId || !semester) {
      return res.status(400).json({ error: "Student profile missing branchId or semester" });
    }

    // Query courses collection
    const coursesSnap = await db.collection("courses")
      .where("branchId", "==", branchId)
      .where("semester", "==", semester)
      .get();

    const courses = coursesSnap.docs.map(doc => {
      const { courseId, courseName, facultyId } = doc.data();
      return { courseId, courseName, facultyId };
    });
    return res.json(courses);
  } catch (error) {
    console.error("Get student courses error:", error);
    return res.status(500).json({ error: error.message });
  }
};
/**
 * Explicit login endpoint for students.
 * Verifies idToken, checks if student exists, returns user data if found.
 */
exports.loginStudent = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    // Verify the ID token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const email = decodedToken.email;
    if (!email) {
      return res.status(400).json({ error: "Invalid token: no email" });
    }

    // Only allow sasi.ac.in emails
    if (!email.endsWith('@sasi.ac.in')) {
      return res.status(403).json({ error: "Only sasi.ac.in emails are allowed." });
    }
    // Check if a student exists with this email
    const studentsSnap = await db.collection("students").where("email", "==", email).limit(1).get();
    if (!studentsSnap.empty) {
      // User found, return user data
      return res.status(200).json({ user: studentsSnap.docs[0].data(), loggedIn: true });
    } else {
      // User not found
      return res.status(404).json({ loggedIn: false, message: "User not found. Please register." });
    }
  } catch (error) {
    console.error("Student login error:", error);
    return res.status(500).json({ error: error.message });
  }
};


