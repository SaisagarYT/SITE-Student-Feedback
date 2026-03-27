const { getAuth } = require("firebase-admin/auth");
const { db } = require("../config/firebase");
/**
 * POST /api/student/submit-feedback
 * Submits feedback for a course.
 * Expects idToken in header or body, courseId, facultyId, phase1, phase2 in body.
 */
exports.submitFeedback = async (req, res) => {
  try {
    const idToken =
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.body.idToken;

    const { courseId, facultyId, phase1, phase2, phase1Remark, phase2Remark } =
      req.body;

    if (!idToken || !courseId || !facultyId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get student
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const email = decodedToken.email;

    const studentSnap = await db
      .collection("students")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (studentSnap.empty) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentId = studentSnap.docs[0].data().studentId;

    // ✅ FIXED: include facultyId
    const feedbackId = `${studentId}_${courseId}_${facultyId}`;

    const feedbackRef = db.collection("feedback").doc(feedbackId);
    const feedbackDoc = await feedbackRef.get();

    let feedbackData = feedbackDoc.exists
      ? feedbackDoc.data()
      : {
          feedbackId,
          studentId,
          courseId,
          facultyId,
          submittedAt: new Date().toISOString(),
        };

    // Validate helper
    const validatePhase = (phase, count) => {
      if (!phase || typeof phase !== "object") return false;
      for (let i = 1; i <= count; i++) {
        const key = `q${i}`;
        if (!(key in phase) || typeof phase[key] !== "number") return false;
      }
      return true;
    };

    // Phase 1
    if (phase1) {
      if (!validatePhase(phase1, 9)) {
        return res.status(400).json({ error: "Invalid phase1" });
      }

      feedbackData.phase1 = {
        ...phase1,
        remark: phase1Remark || "",
      };
    }

    // Phase 2
    if (phase2) {
      if (!validatePhase(phase2, 11)) {
        return res.status(400).json({ error: "Invalid phase2" });
      }

      feedbackData.phase2 = {
        ...phase2,
        remark: phase2Remark || "",
      };
    }

    await feedbackRef.set(feedbackData);

    return res.json({ submitted: true });
  } catch (error) {
    console.error(error);
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
    const { courseId, facultyId } = req.params;

    const idToken =
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.query.idToken;

    if (!courseId || !facultyId || !idToken) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const email = decodedToken.email;

    const studentSnap = await db
      .collection("students")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (studentSnap.empty) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentId = studentSnap.docs[0].data().studentId;

    // ✅ faculty-based check
    const feedbackId = `${studentId}_${courseId}_${facultyId}`;

    const feedbackDoc = await db.collection("feedback").doc(feedbackId).get();

    if (!feedbackDoc.exists) {
      return res.json({ submitted: false });
    }

    const feedback = feedbackDoc.data();

    return res.json({
      submitted: true,
      phase1: feedback.phase1 || null,
      phase2: feedback.phase2 || null,
    });
  } catch (error) {
    console.error(error);
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
    const { semester, branch } = req.query; // optional filters

    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    // STEP 1: Get course
    let query = db.collection("courses").where("courseId", "==", courseId);

    if (semester) {
      query = query.where("semester", "==", semester);
    }

    if (branch) {
      query = query.where("branch", "==", branch);
    }

    const courseSnap = await query.limit(1).get();

    if (courseSnap.empty) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseData = courseSnap.docs[0].data();

    // STEP 2: Get facultyIds (ARRAY ONLY — no string logic anymore)
    const facultyIds = courseData.facultyIds || [];

    if (facultyIds.length === 0) {
      return res.status(404).json({
        error: "No faculty assigned to this course"
      });
    }

    // STEP 3: Fetch faculty (handle Firestore limit)
    const chunkSize = 10;
    let facultyList = [];

    for (let i = 0; i < facultyIds.length; i += chunkSize) {
      const chunk = facultyIds.slice(i, i + chunkSize);

      const facultySnap = await db
        .collection("faculties")
        .where("facultyId", "in", chunk)
        .get();

      facultyList.push(...facultySnap.docs.map(doc => doc.data()));
    }

    // STEP 4: Format response
    const faculties = facultyList.map(f => ({
      facultyId: f.facultyId,
      facultyName: f.facultyName,
      email: f.email || "",
      designation: f.designation || ""
    }));

    return res.json({
      courseId: courseData.courseId,
      courseName: courseData.courseName || "",
      semester: courseData.semester,
      branch: courseData.branch,
      faculties
    });

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
    const idToken =
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.query.idToken;

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const email = decodedToken.email;

    const studentSnap = await db
      .collection("students")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (studentSnap.empty) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentSnap.docs[0].data();

    const { branchId, semester, name } = student;

    const coursesSnap = await db
      .collection("courses")
      .where("branchId", "==", branchId)
      .where("semester", "==", semester)
      .get();

    const courses = coursesSnap.docs.map((doc) => doc.data());

    // Extract facultyIds (handle string DB)
    const allFacultyIds = [
      ...new Set(
        courses.flatMap((c) =>
          c.facultyId
            ? c.facultyId.split(",").map((x) => x.trim())
            : []
        )
      ),
    ];

    let facultyList = [];

    if (allFacultyIds.length > 0) {
      const snap = await db
        .collection("faculties")
        .where("facultyId", "in", allFacultyIds.slice(0, 10))
        .get();

      facultyList = snap.docs.map((d) => d.data());
    }

    const result = courses.map((course) => {
      const ids = course.facultyId
        ? course.facultyId.split(",").map((x) => x.trim())
        : [];

      const faculties = ids.map((fid) => {
        const f = facultyList.find((x) =>
          x.facultyId.includes(fid)
        );

        if (!f) return null;

        return {
          facultyId: f.facultyId,
          facultyName: f.facultyName,
          email: f.email,
          designation: f.designation,
        };
      }).filter(Boolean);

      return {
        courseId: course.courseId,
        courseName: course.courseName,
        credits: course.credits,
        faculties,
      };
    });

    return res.json({
      student: { name, branchId, semester },
      courses: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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


