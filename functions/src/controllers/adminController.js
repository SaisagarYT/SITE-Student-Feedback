// --- Global Phase Activation ---
// GET /api/admin/phase-activation
async function getPhaseActivation(req, res) {
  try {
    const doc = await db.collection("settings").doc("feedbackPhases").get();
    if (!doc.exists) {
      return res.status(200).json({ phase2Active: false });
    }
    const data = doc.data();
    return res.status(200).json({ phase2Active: !!data.phase2Active });
  } catch (error) {
    console.error("Get phase activation error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/admin/phase-activation { phase2Active: true/false }
async function setPhaseActivation(req, res) {
  try {
    const { phase2Active } = req.body;
    if (typeof phase2Active !== "boolean") {
      return res.status(400).json({ error: "phase2Active must be boolean" });
    }
    await db.collection("settings").doc("feedbackPhases").set({ phase2Active }, { merge: true });
    return res.status(200).json({ phase2Active });
  } catch (error) {
    console.error("Set phase activation error:", error);
    return res.status(500).json({ error: error.message });
  }
}
module.exports.getPhaseActivation = getPhaseActivation;
module.exports.setPhaseActivation = setPhaseActivation;
// GET /api/admin/course-analytics
// Returns: [{ courseId, courseName, facultyName, responses, avgRating }]
// Supports filters: ?courseId=...&facultyId=...
async function getCourseAnalytics(req, res) {
  try {
    const { courseId, facultyId, branch, semester, facultyName } = req.query;
    const feedbackSnap = await db.collection("feedback").get();
    const coursesSnap = await db.collection("courses").get();
    const facultiesSnap = await db.collection("faculties").get();

    // Build lookup maps
    const courseMap = {};
    coursesSnap.forEach(doc => {
      const d = doc.data();
      courseMap[d.courseId] = { courseName: d.courseName || d.name || d.courseId, facultyId: d.facultyId };
    });
    const facultyMap = {};
    facultiesSnap.forEach(doc => {
      const d = doc.data();
      facultyMap[d.facultyId] = d.facultyName || d.name || d.facultyId;
    });

    // Group feedback by courseId, and aggregate question-wise ratings for both phases
    const analytics = {};
    feedbackSnap.forEach(doc => {
      const d = doc.data();
      if (!d.courseId) return;
      if (courseId && d.courseId !== courseId) return;
      if (facultyId && d.facultyId !== facultyId) return;

      // Filter by branch (if present)
      if (branch && d.branch && d.branch !== branch) return;
      if (branch && !d.branch && courseMap[d.courseId]?.branch && courseMap[d.courseId].branch !== branch) return;
      if (branch && !d.branch && !courseMap[d.courseId]?.branch) return;

      // Filter by semester (if present)
      if (semester && d.semester && d.semester !== semester) return;
      if (semester && !d.semester && courseMap[d.courseId]?.semester && courseMap[d.courseId].semester !== semester) return;
      if (semester && !d.semester && !courseMap[d.courseId]?.semester) return;

      // Filter by facultyName (if present)
      if (facultyName) {
        const facultyIdFromCourse = courseMap[d.courseId]?.facultyId || d.facultyId;
        const facultyNameFromMap = facultyMap[facultyIdFromCourse];
        if (!facultyNameFromMap || facultyNameFromMap !== facultyName) return;
      }

      if (!analytics[d.courseId]) {
        analytics[d.courseId] = {
          courseId: d.courseId,
          responses: 0,
          ratingSum: 0,
          ratingCount: 0,
          facultyId: d.facultyId,
          phase1: { sum: Array(9).fill(0), count: Array(9).fill(0) },
          phase2: { sum: Array(11).fill(0), count: Array(11).fill(0) }
        };
      }
      // phase1: q1–q9
      if (d.phase1) {
        for (let i = 1; i <= 9; i++) {
          const val = d.phase1[`q${i}`];
          if (typeof val === "number" && val >= 1 && val <= 5) {
            analytics[d.courseId].ratingSum += val;
            analytics[d.courseId].ratingCount++;
            analytics[d.courseId].phase1.sum[i-1] += val;
            analytics[d.courseId].phase1.count[i-1]++;
          }
        }
      }
      // phase2: q1–q11
      if (d.phase2) {
        for (let i = 1; i <= 11; i++) {
          const val = d.phase2[`q${i}`];
          if (typeof val === "number" && val >= 1 && val <= 5) {
            analytics[d.courseId].ratingSum += val;
            analytics[d.courseId].ratingCount++;
            analytics[d.courseId].phase2.sum[i-1] += val;
            analytics[d.courseId].phase2.count[i-1]++;
          }
        }
      }
      analytics[d.courseId].responses++;
    });

    // Prepare output with question-wise averages for both phases
    const result = Object.values(analytics).map((c) => {
      // Calculate question-wise averages for phase1 and phase2
      const phase1Averages = c.phase1.sum.map((sum, i) => c.phase1.count[i] > 0 ? Number((sum / c.phase1.count[i]).toFixed(2)) : null);
      const phase2Averages = c.phase2.sum.map((sum, i) => c.phase2.count[i] > 0 ? Number((sum / c.phase2.count[i]).toFixed(2)) : null);
      return {
        courseId: c.courseId,
        courseName: courseMap[c.courseId]?.courseName || c.courseId,
        facultyName: facultyMap[courseMap[c.courseId]?.facultyId] || c.facultyId || "",
        responses: c.responses,
        avgRating: c.ratingCount > 0 ? Number((c.ratingSum / c.ratingCount).toFixed(2)) : 0,
        phase1Averages, // Array of 9 values (or null if no data)
        phase2Averages  // Array of 11 values (or null if no data)
      };
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Course analytics error:", error);
    return res.status(500).json({ error: error.message });
  }
}
// GET /api/admin/faculty-performance
// Returns: [{ facultyId, facultyName, courseName, responses, avgRating }]
async function getFacultyPerformance(req, res) {
  try {
    const feedbackSnap = await db.collection("feedback").get();
    const facultiesSnap = await db.collection("faculties").get();
    const coursesSnap = await db.collection("courses").get();

    // Build lookup maps
    const facultyMap = {};
    facultiesSnap.forEach(doc => {
      const d = doc.data();
      facultyMap[d.facultyId] = d.facultyName || d.name || d.facultyId;
    });
    const courseMap = {};
    coursesSnap.forEach(doc => {
      const d = doc.data();
      courseMap[d.courseId] = d.courseName || d.name || d.courseId;
    });

    // Group feedback by facultyId
    const perf = {};
    feedbackSnap.forEach(doc => {
      const d = doc.data();
      if (!d.facultyId || !d.courseId) return;
      if (!perf[d.facultyId]) perf[d.facultyId] = { facultyId: d.facultyId, responses: 0, ratingSum: 0, ratingCount: 0, courseId: d.courseId };
      // phase1: q1–q9
      if (d.phase1) {
        for (let i = 1; i <= 9; i++) {
          const val = d.phase1[`q${i}`];
          if (typeof val === "number" && val >= 1 && val <= 5) {
            perf[d.facultyId].ratingSum += val;
            perf[d.facultyId].ratingCount++;
          }
        }
      }
      // phase2: q1–q11
      if (d.phase2) {
        for (let i = 1; i <= 11; i++) {
          const val = d.phase2[`q${i}`];
          if (typeof val === "number" && val >= 1 && val <= 5) {
            perf[d.facultyId].ratingSum += val;
            perf[d.facultyId].ratingCount++;
          }
        }
      }
      perf[d.facultyId].responses++;
    });

    // Prepare output
    const result = Object.values(perf).map((f) => ({
      facultyId: f.facultyId,
      facultyName: facultyMap[f.facultyId] || f.facultyId,
      courseName: courseMap[f.courseId] || f.courseId,
      responses: f.responses,
      avgRating: f.ratingCount > 0 ? Number((f.ratingSum / f.ratingCount).toFixed(2)) : 0
    }));
    return res.status(200).json(result);
  } catch (error) {
    console.error("Faculty performance error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/admin/faculty-detail/:facultyId
// Returns: { totalResponses, overallRating, phase1Average, phase2Average, questionAverages: { q1: avg, ... } }
async function getFacultyDetail(req, res) {
  try {
    const { facultyId } = req.params;
    if (!facultyId) return res.status(400).json({ error: "Missing facultyId" });
    const feedbackSnap = await db.collection("feedback").where("facultyId", "==", facultyId).get();
    let totalResponses = 0;
    let ratingSum = 0, ratingCount = 0;
    let phase1Sum = 0, phase1Count = 0;
    let phase2Sum = 0, phase2Count = 0;
    const questionAverages = {};
    // Init question sums
    for (let i = 1; i <= 9; i++) questionAverages[`phase1_q${i}`] = { sum: 0, count: 0 };
    for (let i = 1; i <= 11; i++) questionAverages[`phase2_q${i}`] = { sum: 0, count: 0 };

    feedbackSnap.forEach(doc => {
      const d = doc.data();
      totalResponses++;
      // phase1
      if (d.phase1) {
        for (let i = 1; i <= 9; i++) {
          const val = d.phase1[`q${i}`];
          if (typeof val === "number" && val >= 1 && val <= 5) {
            ratingSum += val;
            ratingCount++;
            phase1Sum += val;
            phase1Count++;
            questionAverages[`phase1_q${i}`].sum += val;
            questionAverages[`phase1_q${i}`].count++;
          }
        }
      }
      // phase2
      if (d.phase2) {
        for (let i = 1; i <= 11; i++) {
          const val = d.phase2[`q${i}`];
          if (typeof val === "number" && val >= 1 && val <= 5) {
            ratingSum += val;
            ratingCount++;
            phase2Sum += val;
            phase2Count++;
            questionAverages[`phase2_q${i}`].sum += val;
            questionAverages[`phase2_q${i}`].count++;
          }
        }
      }
    });
    // Compute averages
    const questionAveragesResult = {};
    for (let i = 1; i <= 9; i++) {
      const q = questionAverages[`phase1_q${i}`];
      questionAveragesResult[`phase1_q${i}`] = q.count > 0 ? Number((q.sum / q.count).toFixed(2)) : 0;
    }
    for (let i = 1; i <= 11; i++) {
      const q = questionAverages[`phase2_q${i}`];
      questionAveragesResult[`phase2_q${i}`] = q.count > 0 ? Number((q.sum / q.count).toFixed(2)) : 0;
    }
    return res.status(200).json({
      totalResponses,
      overallRating: ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0,
      phase1Average: phase1Count > 0 ? Number((phase1Sum / phase1Count).toFixed(2)) : 0,
      phase2Average: phase2Count > 0 ? Number((phase2Sum / phase2Count).toFixed(2)) : 0,
      questionAverages: questionAveragesResult
    });
  } catch (error) {
    console.error("Faculty detail error:", error);
    return res.status(500).json({ error: error.message });
  }
}
// POST /api/admin/logout
// Verifies idToken and returns success (stateless, for client cleanup)
async function logoutAdmin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }
    // Optionally verify the token (stateless logout)
    await getAuth().verifyIdToken(idToken);
    // No server session to destroy; just acknowledge
    return res.status(200).json({ success: true, message: "Admin logged out." });
  } catch (error) {
    console.error("Admin logout error:", error);
    return res.status(500).json({ error: error.message });
  }
}

const { getAuth } = require("firebase-admin/auth");
const { db } = require("../config/firebase");

// Dashboard Overview Analytics Endpoint
// GET /api/admin/dashboard
// Returns: { totalStudents, totalFaculty, totalCourses, totalFeedback, completionRate, avgRating }
async function getDashboardOverview(req, res) {
  try {
    // 1. Count students
    const studentsSnap = await db.collection("students").get();
    const totalStudents = studentsSnap.size;

    // 2. Count faculties
    const facultiesSnap = await db.collection("faculties").get();
    const totalFaculty = facultiesSnap.size;

    // 3. Count courses
    const coursesSnap = await db.collection("courses").get();
    const totalCourses = coursesSnap.size;


    // 4. Count feedback docs and unique studentIds
    const feedbackSnap = await db.collection("feedback").get();
    const totalFeedback = feedbackSnap.size;
    const uniqueStudentIds = new Set();
    feedbackSnap.forEach(doc => {
      const data = doc.data();
      if (data.studentId) {
        uniqueStudentIds.add(data.studentId);
      } else if (data.email) {
        // fallback: extract studentId from email prefix if possible
        const match = data.email.match(/^([0-9A-Za-z]+)_/);
        if (match) uniqueStudentIds.add(match[1]);
      }
    });
    const uniqueFeedbackStudents = uniqueStudentIds.size;

    // 5. Calculate avgRating and rating distribution (all q1–q9 + q1–q11 from every feedback)
    let ratingSum = 0;
    let ratingCount = 0;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackSnap.forEach(doc => {
      const data = doc.data();
      // phase1: q1–q9 (direct fields)
      if (data.phase1) {
        for (let i = 1; i <= 9; i++) {
          const val = data.phase1[`q${i}`];
          if (typeof val === "number" && val >= 1 && val <= 5) {
            ratingSum += val;
            ratingCount++;
            ratingCounts[val]++;
          }
        }
      }
      // phase2: q1–q11 (direct fields)
      if (data.phase2) {
        for (let i = 1; i <= 11; i++) {
          const val = data.phase2[`q${i}`];
          if (typeof val === "number" && val >= 1 && val <= 5) {
            ratingSum += val;
            ratingCount++;
            ratingCounts[val]++;
          }
        }
      }
    });
    // Each feedback is expected to have 20 questions (9+11)
    const avgRating = (totalFeedback > 0) ? Number((ratingSum / (totalFeedback * 20)).toFixed(2)) : 0;
    // Calculate rating distribution as array of { rating, count, percent }
    const ratingDistribution = [1,2,3,4,5].map(rating => ({
      rating,
      count: ratingCounts[rating],
      percent: ratingCount > 0 ? Math.round((ratingCounts[rating] / ratingCount) * 100) : 0
    }));

    // 6. completionRate = unique students who gave feedback / total students
    const completionRate = totalStudents > 0 ? Math.round((uniqueFeedbackStudents / totalStudents) * 100) : 0;

    // 7. Branch Feedback Participation
    // Map: branchId -> { students: Set, feedback: Set }
    const branchStats = {};
    // Build branch stats from students collection
    studentsSnap.forEach(doc => {
      const s = doc.data();
      if (!s.branchId) return;
      if (!branchStats[s.branchId]) branchStats[s.branchId] = { students: new Set(), feedback: new Set() };
      branchStats[s.branchId].students.add(s.studentId);
    });
    // Add feedback participation by branch
    feedbackSnap.forEach(doc => {
      const f = doc.data();
      let branchId = null;
      if (f.branchId) {
        branchId = f.branchId;
      } else if (f.studentId) {
        // Lookup student branch from studentsSnap
        const stuDoc = studentsSnap.docs.find(d => d.id === f.studentId);
        if (stuDoc) branchId = stuDoc.data().branchId;
      }
      if (branchId && branchStats[branchId]) {
        branchStats[branchId].feedback.add(f.studentId);
      }
    });
    // Prepare branch participation array
    const branchParticipation = Object.entries(branchStats).map(([branch, stats]) => {
      const total = stats.students.size;
      const participated = stats.feedback.size;
      return {
        branch,
        participation: total > 0 ? Math.round((participated / total) * 100) : 0,
        total,
        participated
      };
    });

    // Feedback Submissions by Course
    // Map: courseId -> count
    const courseMap = {};
    coursesSnap.forEach(doc => {
      const c = doc.data();
      courseMap[c.courseId] = {
        courseId: c.courseId,
        courseName: c.courseName || c.courseId,
        feedbackCount: 0
      };
    });
    feedbackSnap.forEach(doc => {
      const f = doc.data();
      if (f.courseId && courseMap[f.courseId]) {
        courseMap[f.courseId].feedbackCount++;
      }
    });
    const feedbackByCourse = Object.values(courseMap);

    return res.status(200).json({
      totalStudents,
      totalFaculty,
      totalCourses,
      totalFeedback,
      completionRate,
      avgRating,
      branchParticipation,
      feedbackByCourse,
      ratingDistribution
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return res.status(500).json({ error: error.message });
  }
}


// POST /api/admin/login
// Verifies idToken, checks if admin exists, returns admin data if found
async function loginAdmin(req, res) {
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

    // Only allow sasi.ac.in emails (optional, remove if not needed)
    if (!email.endsWith('@sasi.ac.in')) {
      return res.status(403).json({ error: "Only sasi.ac.in emails are allowed." });
    }
    // Check if an admin exists with this email
    const adminsSnap = await db.collection("admins").where("email", "==", email).limit(1).get();
    if (!adminsSnap.empty) {
      // Admin found, return admin data
      return res.status(200).json({ admin: adminsSnap.docs[0].data(), loggedIn: true });
    } else {
      // Admin not found
      return res.status(404).json({ loggedIn: false, message: "Admin not found. Please contact system administrator." });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getDashboardOverview,
  loginAdmin,
  logoutAdmin,
  getFacultyPerformance,
  getFacultyDetail,
  getCourseAnalytics,
  getPhaseActivation,
  setPhaseActivation
};
