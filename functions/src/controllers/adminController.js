
const { getAuth } = require("firebase-admin/auth");
const { db } = require("../config/firebase");

// NEW: Unified Admin Dashboard Analytics Endpoint
// GET /api/admin/dashboard?branch=...&semester=...
// Returns: { overview, faculty, courses, students, phases, alerts }
async function getAdminDashboard(req, res) {
  try {
    const { branch, semester } = req.query;
    // Fetch all data in one go
    const [studentsSnap, facultiesSnap, coursesSnap, feedbackSnap] = await Promise.all([
      db.collection("students").get(),
      db.collection("faculties").get(),
      db.collection("courses").get(),
      db.collection("feedback").get()
    ]);

    // Build lookup maps
    const studentMap = {};
    studentsSnap.forEach(doc => { studentMap[doc.data().studentId] = doc.data(); });
    const facultyMap = {};
    facultiesSnap.forEach(doc => { facultyMap[doc.data().facultyId] = doc.data(); });
    const courseMap = {};
    coursesSnap.forEach(doc => { courseMap[doc.data().courseId] = doc.data(); });

    // Containers
    const facultyStats = {};
    const courseStats = {};
    const studentStats = {};
    const phaseStats = {};
    const studentSet = new Set();
    let totalRatingSum = 0, totalRatingCount = 0;

    // Filter helpers
    function feedbackMatchesFilters(f) {
      let course = courseMap[f.courseId];
      if (branch && course && course.branchId && course.branchId !== branch) return false;
      if (semester && course && course.semester && course.semester !== semester) return false;
      return true;
    }

    // Iterate feedbacks
    feedbackSnap.forEach(doc => {
      const f = doc.data();
      if (!f.studentId || !f.courseId || !f.facultyId) return;
      if (!feedbackMatchesFilters(f)) return;

      // Student tracking
      studentSet.add(f.studentId);
      studentStats[f.studentId] = (studentStats[f.studentId] || 0) + 1;

      // Ratings
      let ratings = [];
      if (f.phase1) for (let i = 1; i <= 9; i++) if (typeof f.phase1[`q${i}`] === 'number') ratings.push(f.phase1[`q${i}`]);
      if (f.phase2) for (let i = 1; i <= 11; i++) if (typeof f.phase2[`q${i}`] === 'number') ratings.push(f.phase2[`q${i}`]);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      if (avg > 0) {
        totalRatingSum += avg;
        totalRatingCount++;
      }

      // Faculty aggregation
      if (!facultyStats[f.facultyId]) facultyStats[f.facultyId] = { total: 0, count: 0 };
      facultyStats[f.facultyId].total += avg;
      facultyStats[f.facultyId].count++;

      // Course aggregation
      if (!courseStats[f.courseId]) courseStats[f.courseId] = { total: 0, count: 0 };
      courseStats[f.courseId].total += avg;
      courseStats[f.courseId].count++;

      // Phase tracking
      if (!phaseStats[f.facultyId]) phaseStats[f.facultyId] = { p1Total: 0, p1Count: 0, p2Total: 0, p2Count: 0 };
      if (f.phase1) {
        let p1 = 0, c1 = 0;
        for (let i = 1; i <= 9; i++) if (typeof f.phase1[`q${i}`] === 'number') { p1 += f.phase1[`q${i}`]; c1++; }
        if (c1 > 0) { phaseStats[f.facultyId].p1Total += p1 / c1; phaseStats[f.facultyId].p1Count++; }
      }
      if (f.phase2) {
        let p2 = 0, c2 = 0;
        for (let i = 1; i <= 11; i++) if (typeof f.phase2[`q${i}`] === 'number') { p2 += f.phase2[`q${i}`]; c2++; }
        if (c2 > 0) { phaseStats[f.facultyId].p2Total += p2 / c2; phaseStats[f.facultyId].p2Count++; }
      }
    });

    // Overview
    const totalStudents = studentsSnap.size;
    const participatedStudents = studentSet.size;
    const participationRate = totalStudents > 0 ? (participatedStudents / totalStudents) * 100 : 0;
    const avgRating = totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 0;

    const overview = {
      totalStudents,
      participatedStudents,
      participationRate: Number(participationRate.toFixed(2)),
      avgRating: Number(avgRating.toFixed(2)),
    };

    // Faculty output
    const faculty = Object.entries(facultyStats).map(([facultyId, stat]) => ({
      facultyId,
      facultyName: facultyMap[facultyId]?.facultyName || facultyId,
      avg: stat.count > 0 ? Number((stat.total / stat.count).toFixed(2)) : 0,
      count: stat.count
    })).sort((a, b) => b.avg - a.avg);

    // Course output
    const courses = Object.entries(courseStats).map(([courseId, stat]) => ({
      courseId,
      courseName: courseMap[courseId]?.courseName || courseId,
      avg: stat.count > 0 ? Number((stat.total / stat.count).toFixed(2)) : 0,
      count: stat.count
    })).sort((a, b) => b.avg - a.avg);

    // Student analytics
    const students = {
      active: participatedStudents,
      inactive: totalStudents - participatedStudents,
      activityMap: studentStats
    };

    // Phase comparison
    const phases = Object.entries(phaseStats).map(([facultyId, stat]) => ({
      facultyId,
      facultyName: facultyMap[facultyId]?.facultyName || facultyId,
      phase1Avg: stat.p1Count > 0 ? Number((stat.p1Total / stat.p1Count).toFixed(2)) : null,
      phase2Avg: stat.p2Count > 0 ? Number((stat.p2Total / stat.p2Count).toFixed(2)) : null
    }));

    // Alerts
    const alerts = {
      lowFaculty: faculty.filter(f => f.avg < 2.5),
      lowCourses: courses.filter(c => c.avg < 2.5),
      lowParticipation: participationRate < 50 ? [{ participationRate: Number(participationRate.toFixed(2)) }] : []
    };

    return res.status(200).json({ overview, faculty, courses, students, phases, alerts });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAdminDashboard,
};
