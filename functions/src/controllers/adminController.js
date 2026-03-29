const { db } = require("../config/firebase");

/* ----------------------------- */
/* Classification (from document) */
/* ----------------------------- */

function classify(p) {
  if (p > 95) return "Outstanding";
  if (p > 90) return "Excellent";
  if (p > 85) return "Very Good";
  if (p > 80) return "Good";
  if (p > 75) return "Satisfactory";
  return "Needs Improvement";
}

/* ----------------------------- */
/* Reverse scoring */
/* ----------------------------- */

function reverse(score) {
  return 6 - score;
}

/* ----------------------------- */
/* MAIN ADMIN REPORT API */
/* ----------------------------- */

exports.getAdminReport = async (req, res) => {
  try {
    const {
      branchId,
      semester,
      section,
      phase = "1",
      fromDate,
      toDate,
      view = "department"
    } = req.query;

    if (!branchId) {
      return res.status(400).json({ error: "branchId required" });
    }

    let query = db.collection("feedback");
    // Dynamically build Firestore query based on provided filters
    if (branchId) {
      query = query.where("branchId", "==", branchId);
    }
    if (semester) {
      query = query.where("semester", "==", semester);
    }
    if (section) {
      query = query.where("section", "==", section);
    }

    const feedbackSnap = await query.get();

    if (feedbackSnap.empty) {
      return res.json({ results: [] });
    }

    const map = new Map();

    feedbackSnap.forEach(doc => {
      const f = doc.data();

      // DATE FILTER (robust for Firestore Timestamp or string)
      let submitted;
      if (fromDate || toDate) {
        submitted = f.submittedAt?.toDate
          ? f.submittedAt.toDate()
          : new Date(f.submittedAt);
        if (fromDate && submitted < new Date(fromDate)) return;
        if (toDate && submitted > new Date(toDate)) return;
      }

      const key = `${f.courseId}_${f.facultyId}`;

      if (!map.has(key)) {
        map.set(key, {
          courseId: f.courseId,
          facultyId: f.facultyId,
          responses: []
        });
      }

      const phaseData = phase === "1" ? f.phase1 : f.phase2;
      if (!phaseData) return;

      const maxQ = phase === "1" ? 9 : 11;

      let total = 0;
      let count = 0;

      for (let i = 1; i <= maxQ; i++) {
        let val = phaseData[`q${i}`];
        if (val == null) continue;
        if ((phase === "1" && i === 9) || (phase === "2" && i === 11)) {
          val = reverse(val);
        }
        total += val;
        count++;
      }

      if (count === 0) return;
      const avg = total / count;
      map.get(key).responses.push(avg);
    });

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

    const results = [];

    map.forEach(value => {
      const avg =
        value.responses.reduce((a, b) => a + b, 0) /
        value.responses.length;
      const percentage = avg * 20;
      const faculty = facultyMap.get(value.facultyId);
      const course = courseMap.get(value.courseId);
      results.push({
        facultyId: value.facultyId,
        facultyName: faculty?.facultyName || "",
        courseId: value.courseId,
        courseName: course?.courseName || "",
        avgScore: Number(avg.toFixed(2)),
        percentage: Math.round(percentage),
        category: classify(percentage)
      });
    });

    return res.json({ results });
  } catch (error) {
    console.error("Admin report error:", error);
    return res.status(500).json({ error: error.message });
  }
};
