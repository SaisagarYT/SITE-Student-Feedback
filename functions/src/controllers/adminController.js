const { db } = require("../config/firebase");
const { getAuth } = require("firebase-admin/auth");
/**
 * POST /api/admin/logout
 * Logs out the admin (stateless, just a placeholder for frontend to clear session).
 */
const logoutAdmin = async (req, res) => {
  // In stateless JWT auth, logout is handled on the client by removing the token.
  // This endpoint is just for symmetry and possible future use (e.g., token blacklist).
  return res.status(200).json({ success: true, message: "Logged out" });
};
/**
 * POST /api/admin/login
 * Verifies idToken, checks if admin exists, returns user data if found.
 */
const loginAdmin = async (req, res) => {
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
    // Check if an admin exists with this email
    const adminsSnap = await db.collection("admins").where("email", "==", email).limit(1).get();
    if (!adminsSnap.empty) {
      // User found, return user data
      return res.status(200).json({ user: adminsSnap.docs[0].data(), loggedIn: true });
    } else {
      // User not found
      return res.status(404).json({ loggedIn: false, message: "Admin not found. Please contact support." });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/* ----------------------------- */
/* Helpers */
/* ----------------------------- */

function classify(p) {
  if (p > 95) return "Outstanding";
  if (p > 90) return "Excellent";
  if (p > 85) return "Very Good";
  if (p > 80) return "Good";
  if (p > 75) return "Satisfactory";
  return "Needs Improvement";
}

function reverse(score) {
  return 6 - score;
}

/* ----------------------------- */
/* MAIN ADMIN REPORT */
/* ----------------------------- */

const getAdminReport = async (req, res) => {
  try {
    const {
      branchId,
      semester,
      section,
      facultyId,
      phase = "1",
      fromDate,
      toDate,
      view = "department"
    } = req.query;

    if (!branchId) {
      return res.status(400).json({ error: "branchId required" });
    }

    /* ----------------------------- */
    /* STEP 1: FETCH STUDENTS (for submission rate) */
/* ----------------------------- */

    let studentQuery = db.collection("students")
      .where("branchId", "==", branchId);

    if (semester) {
      studentQuery = studentQuery.where("semester", "==", semester);
    }

    if (section) {
      studentQuery = studentQuery.where("section", "==", section);
    }

    const studentSnap = await studentQuery.get();
    const totalStudents = studentSnap.size;

    /* ----------------------------- */
    /* STEP 2: FETCH FEEDBACK */
/* ----------------------------- */

    let feedbackQuery = db.collection("feedback")
      .where("branchId", "==", branchId);

    if (semester) {
      feedbackQuery = feedbackQuery.where("semester", "==", semester);
    }

    if (section) {
      feedbackQuery = feedbackQuery.where("section", "==", section);
    }

    if (facultyId) {
      feedbackQuery = feedbackQuery.where("facultyId", "==", facultyId);
    }

    const feedbackSnap = await feedbackQuery.get();

    if (feedbackSnap.empty) {
      return res.json({ results: [] });
    }

    /* ----------------------------- */
    /* STEP 3: AGGREGATE */
/* ----------------------------- */

    const map = new Map();

    feedbackSnap.forEach(doc => {
      const f = doc.data();

      // DATE FILTER
      if (fromDate || toDate) {
        const submitted = f.submittedAt?.toDate
          ? f.submittedAt.toDate()
          : new Date(f.submittedAt);

        if (fromDate && submitted < new Date(fromDate)) return;
        if (toDate && submitted > new Date(toDate)) return;
      }

      // PHASE FILTER (CRITICAL)
      if ((phase === "1" && f.phase !== "p1") ||
          (phase === "2" && f.phase !== "p2")) {
        return;
      }

      const key = `${f.courseId}_${f.facultyId}`;

      if (!map.has(key)) {
        map.set(key, {
          courseId: f.courseId,
          facultyId: f.facultyId,
          responses: [],
          submissions: 0,
          perQuestion: {},
        });
      }

      const ratings = f.ratings;
      if (!ratings) return;

      const maxQ = phase === "1" ? 9 : 11;

      let total = 0;
      let count = 0;

      for (let i = 1; i <= maxQ; i++) {
        let val = ratings[`q${i}`];
        if (val == null) continue;

        // reverse scoring
        if ((phase === "1" && i === 9) || (phase === "2" && i === 11)) {
          val = reverse(val);
        }

        total += val;
        count++;

        // Per-question aggregation
        const pq = map.get(key).perQuestion;
        if (!pq[`q${i}`]) pq[`q${i}`] = [];
        pq[`q${i}`].push(val);
      }

      if (count === 0) return;

      const avg = total / count;

      map.get(key).responses.push(avg);
      map.get(key).submissions += 1;
    });

    /* ----------------------------- */
    /* STEP 4: LOAD MASTER DATA */
/* ----------------------------- */

    const [facultySnap, courseSnap] = await Promise.all([
      db.collection("faculties").get(),
      db.collection("courses").get()
    ]);

    const facultyMap = new Map();
    const courseMap = new Map();

    facultySnap.forEach(doc => {
      const f = doc.data();
      facultyMap.set(f.facultyId, f);
    });

    courseSnap.forEach(doc => {
      const c = doc.data();
      courseMap.set(c.courseId, c);
    });

    /* ----------------------------- */
    /* STEP 5: BUILD RESULT */
/* ----------------------------- */

    const results = [];

    map.forEach(value => {
      const avg =
        value.responses.length > 0
          ? value.responses.reduce((a, b) => a + b, 0) / value.responses.length
          : 0;

      const percentage = avg * 20;

      const submissionRate =
        totalStudents > 0
          ? (value.submissions / totalStudents) * 100
          : 0;

      const faculty = facultyMap.get(value.facultyId);
      const course = courseMap.get(value.courseId);

      // Per-question averages
      const perQuestionAverages = {};
      const pq = value.perQuestion || {};
      Object.keys(pq).forEach(qKey => {
        const arr = pq[qKey];
        if (arr && arr.length > 0) {
          perQuestionAverages[qKey] = Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
        } else {
          perQuestionAverages[qKey] = null;
        }
      });

      // Classify course type using regex
      const courseName = course?.courseName || "";
      const type = /lab/i.test(courseName) ? "lab" : "theory";

      results.push({
        facultyId: value.facultyId,
        facultyName: faculty?.facultyName || "",
        courseId: value.courseId,
        courseName,
        type,

        avgScore: Number(avg.toFixed(2)),
        percentage: Math.round(percentage),
        category: classify(percentage),

        totalStudents,
        submitted: value.submissions,
        submissionRate: Math.round(submissionRate),

        perQuestionAverages
      });
    });

    // Sort results by percentage descending
    results.sort((a, b) => b.percentage - a.percentage);

    return res.json({ results });

  } catch (error) {
    console.error("Admin report error:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAdminReport,
  loginAdmin,
  logoutAdmin
};