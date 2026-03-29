const { db } = require("../config/firebase");

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
          submissions: 0
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

      results.push({
        facultyId: value.facultyId,
        facultyName: faculty?.facultyName || "",
        courseId: value.courseId,
        courseName: course?.courseName || "",

        avgScore: Number(avg.toFixed(2)),
        percentage: Math.round(percentage),
        category: classify(percentage),

        totalStudents,
        submitted: value.submissions,
        submissionRate: Math.round(submissionRate)
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
  getAdminReport
};