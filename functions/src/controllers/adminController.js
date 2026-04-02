


const { db } = require("../config/firebase");
const { getAuth } = require("firebase-admin/auth");
const jwt = require("jsonwebtoken");
const { defineSecret } = require('firebase-functions/params');
const { onRequest } = require('firebase-functions/v2/https');

// Firebase parameterized secret for JWT (rename to JWT_SECRET for clarity)
const jwtSecret = defineSecret('HTTP_FEEDBACK_SECRET'); // used for secret registration only


// Get feedback phase dates for a semester in a given academic year (new structure)
const getFeedbackReportDates = async (req, res) => {
  try {
    const { academicYear, semester } = req.query;
    if (!academicYear || !semester) {
      return res.status(400).json({ error: "Missing required query params" });
    }
    const semesterRef = db.collection("feedbackreport").doc(academicYear).collection(semester);
    const [phase1Doc, phase2Doc] = await Promise.all([
      semesterRef.doc("phase1report").get(),
      semesterRef.doc("phase2report").get()
    ]);
    const result = {};
    if (phase1Doc.exists) {
      result.phase1Date = phase1Doc.data().date;
    }
    if (phase2Doc.exists) {
      result.phase2Date = phase2Doc.data().date;
    }
    return res.json(result);
  } catch (error) {
    console.error("getFeedbackReportDates error:", error);
    return res.status(500).json({ error: error.message });
  }
};
// List all feedbackreport years and their semesters with data
const listFeedbackReportYears = async (req, res) => {
  try {
    const yearsSnap = await db.collection("feedbackreport").get();
    if (yearsSnap.empty) {
      return res.json([]); // No years present
    }
    const result = [];
    for (const yearDoc of yearsSnap.docs) {
      const yearId = yearDoc.id;
      const semestersSnap = await db.collection("feedbackreport").doc(yearId).collection("semesters").get();
      if (!semestersSnap.empty) {
        const semesters = semestersSnap.docs.map(doc => ({
          semester: doc.id,
          ...doc.data()
        }));
        result.push({ year: yearId, semesters });
      }
    }
    return res.json(result);
  } catch (error) {
    console.error("listFeedbackReportYears error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Middleware to verify admin JWT
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.admin_token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decoded = jwt.verify(token, req.jwtSecret);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const logoutAdmin = async (req, res) => {

  return res.status(200).json({ success: true, message: "Logged out" });
};


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
      // User found, generate JWT
      const user = adminsSnap.docs[0].data();
      const payload = {
        email: user.email,
        role: "admin"
      };
      // 3 hours expiry
      const token = jwt.sign(payload, req.jwtSecret, { expiresIn: "3h" });
      // Set as httpOnly cookie with cross-site settings
      res.cookie("admin_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 3 * 60 * 60 * 1000 // 3 hours
      });
      // Return token for debugging (remove later)
      return res.status(200).json({ user, loggedIn: true, token });
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
          submittedDates: [],
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

      // Track submitted date for this feedback
      const submittedAt = f.submittedAt?.toDate ? f.submittedAt.toDate() : new Date(f.submittedAt);
      map.get(key).submittedDates.push(submittedAt);
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

      // Per-question averages and counts
      const perQuestionAverages = {};
      const perQuestionCounts = {};
      const pq = value.perQuestion || {};
      Object.keys(pq).forEach(qKey => {
        const arr = pq[qKey];
        if (arr && arr.length > 0) {
          perQuestionAverages[qKey] = Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
          perQuestionCounts[qKey] = arr.length;
        } else {
          perQuestionAverages[qKey] = null;
          perQuestionCounts[qKey] = 0;
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

        perQuestionAverages,
        perQuestionCounts,

        // Add most common submitted date for this faculty-course
        submittedDate: (value.submittedDates && value.submittedDates.length > 0)
          ? (() => {
              // Convert all dates to yyyy-mm-dd string for grouping
              const dateStrings = value.submittedDates.map(d => {
                const dt = new Date(d);
                return dt.toISOString().split('T')[0];
              });
              // Count occurrences
              const freq = {};
              dateStrings.forEach(ds => { freq[ds] = (freq[ds] || 0) + 1; });
              // Find the most common date (mode)
              let maxCount = 0, modeDate = null;
              for (const ds in freq) {
                if (freq[ds] > maxCount) {
                  maxCount = freq[ds];
                  modeDate = ds;
                }
              }
              // Return as Date object (midnight UTC)
              return modeDate ? new Date(modeDate) : null;
            })()
          : null,
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


const setFeedbackReportDates = async (req, res) => {
  try {
    const { academicYear, semester, phase1Date, phase2Date } = req.body;
    if (!academicYear || !semester) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!phase1Date && !phase2Date) {
      return res.status(400).json({ error: "At least one phase date required" });
    }
    // Ensure parent document exists
    await db.collection("feedbackreport").doc(academicYear).set({ createdAt: new Date() }, { merge: true });

    // Store phase1report and/or phase2report as documents in the semester subcollection
    const semesterRef = db.collection("feedbackreport").doc(academicYear).collection(semester);
    const updates = [];
    if (phase1Date) {
      updates.push(
        semesterRef.doc("phase1report").set({ date: new Date(phase1Date), updatedAt: new Date() }, { merge: true })
      );
    }
    if (phase2Date) {
      updates.push(
        semesterRef.doc("phase2report").set({ date: new Date(phase2Date), updatedAt: new Date() }, { merge: true })
      );
    }
    await Promise.all(updates);
    return res.json({ success: true });
  } catch (error) {
    console.error("setFeedbackReportDates error:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAdminReport,
  logoutAdmin,
  verifyAdmin,
  loginAdmin,
  setFeedbackReportDates,
  getFeedbackReportDates,
  listFeedbackReportYears
};