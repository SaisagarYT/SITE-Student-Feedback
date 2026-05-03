


const { db } = require("../config/firebase");
const { getAuth } = require("firebase-admin/auth");
const jwt = require("jsonwebtoken");
const { defineSecret } = require('firebase-functions/params');
const { onRequest } = require('firebase-functions/v2/https');

// Firebase parameterized secret for JWT (rename to JWT_SECRET for clarity)
const jwtSecret = defineSecret('HTTP_FEEDBACK_SECRET'); // used for secret registration only

function normalizeSemesterKey(semester) {
  if (!semester) return null;
  const normalized = String(semester).trim().toLowerCase().replace(/\s+/g, "");

  if (["sem1", "semester1", "odd"].includes(normalized)) {
    return "sem1";
  }
  if (["sem2", "semester2", "even"].includes(normalized)) {
    return "sem2";
  }

  if (/-i$/.test(normalized) && !/-ii$/.test(normalized)) {
    return "sem1";
  }
  if (/-ii$/.test(normalized)) {
    return "sem2";
  }

  return null;
}

function toIsoDate(value) {
  if (!value) return undefined;
  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}


function pickFirstString(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function normalizeId(value) {
  if (value == null) return "";
  return String(value).trim();
}


// Get feedback phase dates for a semester in a given academic year (new structure)
const getFeedbackReportDates = async (req, res) => {
  try {
    const { academicYear, semester } = req.query;
    if (!academicYear || !semester) {
      return res.status(400).json({ error: "Missing required query params" });
    }
    const semesterKey = normalizeSemesterKey(semester);
    if (!semesterKey) {
      return res.status(400).json({ error: "Invalid semester value" });
    }
    const semesterRef = db.collection("feedbackreport").doc(academicYear).collection(semesterKey);
    const [phase1Doc, phase2Doc] = await Promise.all([
      semesterRef.doc("phase1report").get(),
      semesterRef.doc("phase2report").get()
    ]);
    const result = {};
    if (phase1Doc.exists) {
      result.phase1Date = toIsoDate(phase1Doc.data().date);
    }
    if (phase2Doc.exists) {
      result.phase2Date = toIsoDate(phase2Doc.data().date);
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
      const semesterCollections = await yearDoc.ref.listCollections();
      const semesterRefMap = new Map();
      for (const colRef of semesterCollections) {
        const mapped = normalizeSemesterKey(colRef.id);
        if (!mapped) continue;
        if (!semesterRefMap.has(mapped) || colRef.id === mapped) {
          semesterRefMap.set(mapped, colRef);
        }
      }

      const semesters = [];
      for (const semesterKey of ["sem1", "sem2"]) {
        const colRef = semesterRefMap.get(semesterKey);
        if (!colRef) continue;

        const [phase1Doc, phase2Doc] = await Promise.all([
          colRef.doc("phase1report").get(),
          colRef.doc("phase2report").get()
        ]);

        if (!phase1Doc.exists && !phase2Doc.exists) {
          continue;
        }

        const phase1Data = phase1Doc.exists ? phase1Doc.data() : {};
        const phase2Data = phase2Doc.exists ? phase2Doc.data() : {};
        semesters.push({
          semester: semesterKey,
          phase1Date: toIsoDate(phase1Data.date),
          phase2Date: toIsoDate(phase2Data.date),
          updatedAt: toIsoDate(phase2Data.updatedAt || phase1Data.updatedAt)
        });
      }

      if (semesters.length > 0) {
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
    let totalStudents = studentSnap.size;

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

    // If none of the fetched feedback docs belong to the requested phase,
    // return an empty result set early. This prevents returning Phase-1
    // aggregates when the admin explicitly asked for Phase-2 and no
    // Phase-2 documents exist for the filters.
    const requestedPhaseField = phase === "1" ? "p1" : "p2";
    const hasRequestedPhase = feedbackSnap.docs.some(doc => doc.data().phase === requestedPhaseField);
    if (!hasRequestedPhase) {
      return res.json({ results: [] });
    }

    /* ----------------------------- */
    /* STEP 3: FETCH COURSES & BUILD EXPECTED PAIRS */
/* ----------------------------- */

    let courseQuery = db.collection("courses")
      .where("branchId", "==", branchId);

    if (semester) {
      courseQuery = courseQuery.where("semester", "==", semester);
    }

    if (section) {
      courseQuery = courseQuery.where("section", "==", section);
    }

    const courseQuerySnap = await courseQuery.get();
    const expectedCourseFacultyPairs = new Set();
    const coursesMissingFacultyIds = [];

    courseQuerySnap.forEach(doc => {
      const course = doc.data();
      const courseId = normalizeId(pickFirstString(course, ["courseId", "Course Code", "courseCode", "CourseCode"]));

      // STRICT: Only accept normalized facultyIds array
      if (!Array.isArray(course.facultyIds) || course.facultyIds.length === 0) {
        coursesMissingFacultyIds.push(courseId);
        return; // Skip this course
      }

      course.facultyIds.forEach(fId => {
        const normalizedFacultyId = normalizeId(fId);
        if (normalizedFacultyId) expectedCourseFacultyPairs.add(`${courseId}::${normalizedFacultyId}`);
      });
    });

    // Log warning if courses are missing proper facultyIds
    if (coursesMissingFacultyIds.length > 0) {
      console.warn(`⚠️ ${coursesMissingFacultyIds.length} course(s) missing facultyIds array: ${coursesMissingFacultyIds.join(", ")}. Run /api/admin/normalize-courses to fix.`);
    }

    /* ----------------------------- */
    /* BUILD Student -> ExpectedPairs */
    /* ----------------------------- */

    const studentExpectedPairs = new Map();
    const studentAliases = new Map();

    studentSnap.forEach(doc => {
      const student = doc.data();
      const sid = normalizeId(student.studentId);
      const rollNumber = normalizeId(pickFirstString(student, ["rollNumber", "Roll Number", "rollno", "Roll No", "rollNo"]));
      const studentName = normalizeId(pickFirstString(student, ["studentName", "Student Name", "name", "Name"]));
      if (!sid) return;
      if (!studentAliases.has(sid)) studentAliases.set(sid, new Set());
      studentAliases.get(sid).add(sid);
      if (rollNumber) studentAliases.get(sid).add(rollNumber);
      if (studentName) studentAliases.get(sid).add(studentName);
    });

    studentSnap.forEach(doc => {
      const student = doc.data();
      const sid = normalizeId(student.studentId).toLowerCase();
      const rollNumber = normalizeId(pickFirstString(student, ["rollNumber", "Roll Number", "rollno", "Roll No", "rollNo"]));
      if (sid) {
        if (!studentAliases.has(sid)) studentAliases.set(sid, new Set());
        studentAliases.get(sid).add(sid);
        if (rollNumber) studentAliases.get(sid).add(rollNumber);
      }
    });

    // Try to read explicit enrollment mapping from `studentCourses` collection
    try {
      let scQuery = db.collection("studentCourses").where("branchId", "==", branchId);
      if (semester) scQuery = scQuery.where("semester", "==", semester);
      if (section) scQuery = scQuery.where("section", "==", section);
      const studentCoursesSnap = await scQuery.get();

      if (!studentCoursesSnap.empty) {
        studentCoursesSnap.forEach(doc => {
          const rec = doc.data();
          const sid = rec.studentId;
          const cId = normalizeId(pickFirstString(rec, ["courseId", "courseId"])) || normalizeId(rec.courseId);
          const fId = normalizeId(pickFirstString(rec, ["facultyId", "facultyId"])) || normalizeId(rec.facultyId);
          if (!sid || !cId || !fId) return;
          const pair = `${cId}::${fId}`;
          if (!studentExpectedPairs.has(sid)) studentExpectedPairs.set(sid, new Set());
          studentExpectedPairs.get(sid).add(pair);
        });
      } else {
        // Fallback: assign section-wide expected pairs to every student in the studentSnap
        studentSnap.forEach(doc => {
          const s = doc.data();
          const sid = s.studentId;
          if (!sid) return;
          studentExpectedPairs.set(sid, new Set(expectedCourseFacultyPairs));
        });
      }
    } catch (err) {
      // If collection doesn't exist or query fails, fallback to section-wide assignment
      studentSnap.forEach(doc => {
        const s = doc.data();
        const sid = s.studentId;
        if (!sid) return;
        studentExpectedPairs.set(sid, new Set(expectedCourseFacultyPairs));
      });
    }
    // Use only students who actually have assigned pairs as denominator
    totalStudents = studentExpectedPairs.size;

    // Build unique expected pairs from studentExpectedPairs (for diagnostics and global checks)
    const uniqueExpectedPairs = new Set();
    studentExpectedPairs.forEach(set => {
      set.forEach(p => uniqueExpectedPairs.add(p));
    });

    /* ----------------------------- */
    /* STEP 4: AGGREGATE & TRACK STUDENT SUBMISSIONS */
/* ----------------------------- */

    const map = new Map();
    const studentSubmissions = new Map(); // studentId -> Set of submitted pairs

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

      const normalizedCourseId = normalizeId(f.courseId);
      const normalizedFacultyId = normalizeId(f.facultyId);
      const key = `${normalizedCourseId}::${normalizedFacultyId}`;
      const studentId = normalizeId(f.studentId).toLowerCase();

      // Track unique student submissions per pair
      if (!studentSubmissions.has(studentId)) {
        studentSubmissions.set(studentId, new Set());
      }
      studentSubmissions.get(studentId).add(key);

      if (!map.has(key)) {
        map.set(key, {
          courseId: normalizedCourseId,
          facultyId: normalizedFacultyId,
          responses: [],
          studentSubmitters: new Set(),
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
      map.get(key).studentSubmitters.add(studentId);

      // Track submitted date for this feedback
      const submittedAt = f.submittedAt?.toDate ? f.submittedAt.toDate() : new Date(f.submittedAt);
      map.get(key).submittedDates.push(submittedAt);
    });

    /* ----------------------------- */
    /* COUNT STUDENTS WHO COMPLETED ALL PAIRS */
/* ----------------------------- */

    let studentsCompletedPhase = 0;

    // Evaluate completion per student using student-scoped expected pairs
    studentExpectedPairs.forEach((expectedPairs, studentId) => {
      if (!expectedPairs || expectedPairs.size === 0) return; // skip students with no assigned pairs
      const submittedPairs = studentSubmissions.get(studentId) || new Set();
      let completedAll = true;
      for (const pair of expectedPairs) {
        if (!submittedPairs.has(pair)) {
          completedAll = false;
          break;
        }
      }
      if (completedAll) studentsCompletedPhase += 1;
    });

    /* ----------------------------- */
    /* STEP 4: LOAD MASTER DATA (SECTION-FILTERED) */
/* ----------------------------- */

    // Collect used faculty IDs from expected pairs
    const usedFacultyIds = new Set();
    expectedCourseFacultyPairs.forEach(pair => {
      const [, facultyId] = pair.split("::");
      if (facultyId) usedFacultyIds.add(facultyId);
    });

    // Load section-filtered courses and faculties
    let sectionCourseQuery = db.collection("courses").where("branchId", "==", branchId);
    if (semester) sectionCourseQuery = sectionCourseQuery.where("semester", "==", semester);
    if (section) sectionCourseQuery = sectionCourseQuery.where("section", "==", section);

    const [facultySnap, courseSnap] = await Promise.all([
      db.collection("faculties").get(),
      sectionCourseQuery.get()
    ]);

    const facultyMap = new Map();
    const courseMap = new Map();

    facultySnap.forEach(doc => {
      const f = doc.data();
      const facultyId = normalizeId(pickFirstString(f, ["facultyId", "Faculty Id", "FacultyID", "facultyID"]));
      // Only add if used in this section's expected pairs
      if (facultyId && usedFacultyIds.has(facultyId)) {
        facultyMap.set(facultyId, f);
      }
    });

    courseSnap.forEach(doc => {
      const c = doc.data();
      const courseId = normalizeId(pickFirstString(c, ["courseId", "Course Code", "courseCode", "CourseCode"]));
      if (courseId) {
        courseMap.set(courseId, c);
      }
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

      // Use completed count for submission rate (all rows show same value: students who completed all pairs)
      const submissionRate =
        totalStudents > 0
          ? (studentsCompletedPhase / totalStudents) * 100
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
        submitted: studentsCompletedPhase,
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

    // Calculate completion percentage
    const completionPercent = totalStudents > 0 
      ? Math.round((studentsCompletedPhase / totalStudents) * 100)
      : 0;

    // DIAGNOSTIC: Build pair submission counts for debugging mismatch
    const pairsWithSubmitters = {};
    map.forEach((value, key) => {
      pairsWithSubmitters[key] = value.studentSubmitters.size;
    });

    // DIAGNOSTIC: Sample student submission sets (uses student-scoped expected pairs)
    const sampleStudentSets = [];
    let sampleCount = 0;
    for (const [studentId, pairs] of studentSubmissions.entries()) {
      if (sampleCount >= 3) break;
      const expectedForStudent = studentExpectedPairs.get(studentId) || new Set();
      sampleStudentSets.push({
        studentId,
        submittedPairs: Array.from(pairs),
        count: pairs.size,
        completedAll: expectedForStudent.size > 0 && Array.from(expectedForStudent).every(p => pairs.has(p)),
        expectedCount: expectedForStudent.size
      });
      sampleCount++;
    }

    return res.json({ 
      results,
      summary: {
        totalStudents,
        studentsCompletedPhase,
        completionPercent
      },
      // Diagnostic fields for debugging
      diagnostic: {
        expectedPairsCount: uniqueExpectedPairs.size,
        expectedPairsList: Array.from(uniqueExpectedPairs),
        pairsWithSubmitters,
        totalUniqueStudentsWhoSubmitted: studentSubmissions.size,
        sampleStudentSets,
        coursesMissingFacultyIds: coursesMissingFacultyIds.length > 0 ? coursesMissingFacultyIds : null
      }
    });

  } catch (error) {
    console.error("Admin report error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Get detailed student feedback records by branch/semester/section/phase
const getStudentFeedbackDetails = async (req, res) => {
  try {
    const {
      branchId,
      semester,
      section,
      phase = "1",
      fromDate,
      toDate
    } = req.query;

    if (!branchId) {
      return res.status(400).json({ error: "branchId required" });
    }

    /* ----------------------------- */
    /* STEP 1: FETCH FEEDBACK */
/* ----------------------------- */

    let feedbackQuery = db.collection("feedback")
      .where("branchId", "==", branchId);

    if (semester) {
      feedbackQuery = feedbackQuery.where("semester", "==", semester);
    }

    if (section) {
      feedbackQuery = feedbackQuery.where("section", "==", section);
    }

    let courseQuery2 = db.collection("courses").where("branchId", "==", branchId);
    if (semester) courseQuery2 = courseQuery2.where("semester", "==", semester);
    if (section) courseQuery2 = courseQuery2.where("section", "==", section);

    const [feedbackSnap, courseSnap] = await Promise.all([
      feedbackQuery.get(),
      courseQuery2.get()
    ]);

    if (feedbackSnap.empty) {
      return res.json({ records: [] });
    }

    const courseMap = new Map();
    const usedFacultyIds = new Set();

    courseSnap.forEach((doc) => {
      const course = doc.data();
      const courseId = normalizeId(pickFirstString(course, ["courseId", "Course Code", "courseCode", "CourseCode"]));
      if (!courseId) return;
      courseMap.set(courseId, course);
      if (Array.isArray(course.facultyIds)) {
        course.facultyIds.forEach(fId => {
          const normalizedFId = normalizeId(fId);
          if (normalizedFId) usedFacultyIds.add(normalizedFId);
        });
      }
    });

    let studentQuery = db.collection("students")
      .where("branchId", "==", branchId);
    if (semester) studentQuery = studentQuery.where("semester", "==", semester);
    if (section) studentQuery = studentQuery.where("section", "==", section);

    const studentSnap = await studentQuery.get();

    let facultySnap = await db.collection("faculties").get();
    const facultyMap = new Map();
    facultySnap.forEach((doc) => {
      const faculty = doc.data();
      const facultyId = normalizeId(pickFirstString(faculty, ["facultyId", "Faculty Id", "FacultyID", "facultyID"]));
      if (!facultyId || !usedFacultyIds.has(facultyId)) return;
      facultyMap.set(facultyId, faculty);
    });

    const studentExpectedPairs = new Map();
    const studentAliases = new Map();
    try {
      let scQuery = db.collection("studentCourses").where("branchId", "==", branchId);
      if (semester) scQuery = scQuery.where("semester", "==", semester);
      if (section) scQuery = scQuery.where("section", "==", section);
      const studentCoursesSnap = await scQuery.get();

      if (!studentCoursesSnap.empty) {
        studentCoursesSnap.forEach(doc => {
          const rec = doc.data();
          const sid = normalizeId(rec.studentId).toLowerCase();
          const cId = normalizeId(rec.courseId || pickFirstString(rec, ["courseId", "Course Code", "courseCode", "CourseCode"]));
          const fId = normalizeId(rec.facultyId || pickFirstString(rec, ["facultyId", "Faculty Id", "FacultyID", "facultyID"]));
          if (!sid || !cId || !fId) return;
          if (!studentExpectedPairs.has(sid)) studentExpectedPairs.set(sid, new Set());
          studentExpectedPairs.get(sid).add(`${cId}::${fId}`);
        });
      } else {
        // Fallback: Build expected pairs from courses collection grouped by section
        // Each student gets the courses for THEIR section only
        
        const sectionCoursesMap = new Map(); // section -> Set of pairs
        
        courseSnap.forEach((doc) => {
          const course = doc.data();
          const courseId = normalizeId(pickFirstString(course, ["courseId", "Course Code", "courseCode", "CourseCode"]));
          const courseSection = course.section;
          
          if (!courseId || !courseSection) return;
          
          let facultyIds = [];
          if (Array.isArray(course.facultyIds) && course.facultyIds.length > 0) {
            facultyIds = course.facultyIds;
          } else if (course.facultyId) {
            facultyIds = [course.facultyId];
          } else if (course["Faculty Id"]) {
            facultyIds = [course["Faculty Id"]];
          }
          
          if (facultyIds.length === 0) return;
          
          if (!sectionCoursesMap.has(courseSection)) {
            sectionCoursesMap.set(courseSection, new Set());
          }
          
          facultyIds.forEach(fId => {
            const normalizedFId = normalizeId(fId);
            if (normalizedFId) {
              sectionCoursesMap.get(courseSection).add(`${courseId}::${normalizedFId}`);
            }
          });
        });
        
        // Assign each student their section's courses
        studentSnap.forEach(doc => {
          const student = doc.data();
          const sid = normalizeId(student.studentId).toLowerCase();
          const studentSection = student.section;
          
          if (!sid || !studentSection) return;
          
          const sectionPairs = sectionCoursesMap.get(studentSection) || new Set();
          studentExpectedPairs.set(sid, new Set(sectionPairs));
        });
        
        console.log("DEBUG getStudentFeedbackDetails section-based pairs. Sections found:", sectionCoursesMap.size);
      }
    } catch (err) {
      // Fallback: Build expected pairs from courses collection grouped by section
      // Each student gets the courses for THEIR section only
      
      const sectionCoursesMap = new Map(); // section -> Set of pairs
      
      courseSnap.forEach((doc) => {
        const course = doc.data();
        const courseId = normalizeId(pickFirstString(course, ["courseId", "Course Code", "courseCode", "CourseCode"]));
        const courseSection = course.section;
        
        if (!courseId || !courseSection) return;
        
        let facultyIds = [];
        if (Array.isArray(course.facultyIds) && course.facultyIds.length > 0) {
          facultyIds = course.facultyIds;
        } else if (course.facultyId) {
          facultyIds = [course.facultyId];
        } else if (course["Faculty Id"]) {
          facultyIds = [course["Faculty Id"]];
        }
        
        if (facultyIds.length === 0) return;
        
        if (!sectionCoursesMap.has(courseSection)) {
          sectionCoursesMap.set(courseSection, new Set());
        }
        
        facultyIds.forEach(fId => {
          const normalizedFId = normalizeId(fId);
          if (normalizedFId) {
            sectionCoursesMap.get(courseSection).add(`${courseId}::${normalizedFId}`);
          }
        });
      });
      
      // Assign each student their section's courses
      studentSnap.forEach(doc => {
        const student = doc.data();
        const sid = normalizeId(student.studentId).toLowerCase();
        const studentSection = student.section;
        
        if (!sid || !studentSection) return;
        
        const sectionPairs = sectionCoursesMap.get(studentSection) || new Set();
        studentExpectedPairs.set(sid, new Set(sectionPairs));
      });
      
      console.log("DEBUG getStudentFeedbackDetails catch section-based pairs. Sections found:", sectionCoursesMap.size);
    }

    /* ----------------------------- */
    /* STEP 2: BUILD RECORDS */
/* ----------------------------- */

    const records = [];

    feedbackSnap.forEach(doc => {
      const f = doc.data();

      // PHASE FILTER
      if ((phase === "1" && f.phase !== "p1") ||
          (phase === "2" && f.phase !== "p2")) {
        return;
      }

      // DATE FILTER
      if (fromDate || toDate) {
        const submitted = f.submittedAt?.toDate
          ? f.submittedAt.toDate()
          : new Date(f.submittedAt);

        if (fromDate && submitted < new Date(fromDate)) return;
        if (toDate && submitted > new Date(toDate)) return;
      }

      const maxQ = phase === "1" ? 9 : 11;
      const answers = {};

      for (let i = 1; i <= maxQ; i++) {
        const key = `q${i}`;
        answers[key] = f.ratings && f.ratings[key] != null ? f.ratings[key] : null;
      }

      const courseId = normalizeId(pickFirstString(f, ["courseId", "Course Code", "courseCode", "CourseCode"]));
      const facultyId = normalizeId(pickFirstString(f, ["facultyId", "Faculty Id", "FacultyID", "facultyID"]));
      const courseDoc = courseMap.get(courseId) || {};
      const facultyDoc = facultyMap.get(facultyId) || {};

      records.push({
        studentId: normalizeId(f.studentId),
        studentName: pickFirstString(f, ["studentName", "Student Name", "name", "Name"]),
        rollNumber: pickFirstString(f, ["rollNumber", "Roll Number", "rollno", "Roll No", "rollNo"]) || "",
        courseId,
        courseName: pickFirstString(f, ["courseName", "Course Name", "CourseName", "name", "Name"]) || pickFirstString(courseDoc, ["courseName", "Course Name", "CourseName", "name", "Name"]) || "",
        facultyId,
        facultyName: pickFirstString(f, ["facultyName", "FacultyName", "Faculty Name", "name", "Name"]) || pickFirstString(facultyDoc, ["facultyName", "FacultyName", "Faculty Name", "name", "Name"]) || "",
        branchId: f.branchId,
        semester: f.semester,
        section: f.section,
        phase: f.phase,
        answers, // q1, q2, ..., q9/q11
        submittedAt: f.submittedAt ? (f.submittedAt.toDate ? f.submittedAt.toDate().toISOString() : new Date(f.submittedAt).toISOString()) : null
      });
    });

    // Sort by studentId, then courseId
    records.sort((a, b) => {
      if (a.studentId !== b.studentId) return (a.studentId || "").localeCompare(b.studentId || "");
      return (a.courseId || "").localeCompare(b.courseId || "");
    });

    // Add placeholder records for students with no feedback submissions
    const studentsWithFeedback = new Set();
    records.forEach(r => {
      studentsWithFeedback.add(normalizeId(r.studentId).toLowerCase());
    });

    studentSnap.forEach(doc => {
      const student = doc.data();
      const sid = normalizeId(student.studentId).toLowerCase();
      
      if (!studentsWithFeedback.has(sid)) {
        // Add placeholder record for this student with no feedback
        records.push({
          studentId: normalizeId(student.studentId),
          studentName: pickFirstString(student, ["studentName", "Student Name", "name", "Name"]),
          rollNumber: pickFirstString(student, ["rollNumber", "Roll N umber", "rollno", "Roll No", "rollNo"]) || "",
          courseId: "",
          courseName: "",
          facultyId: "",
          facultyName: "",
          branchId: student.branchId,
          semester: student.semester,
          section: student.section,
          phase: "",
          answers: {},
          submittedAt: null
        });
      }
    });

    return res.json({
      records,
      count: records.length,
      expectedPairsByStudent: Object.fromEntries(
        Array.from(studentExpectedPairs.entries()).map(([sid, pairs]) => [sid, Array.from(pairs)])
      )
    });

  } catch (error) {
    console.error("getStudentFeedbackDetails error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Normalize course schema: convert facultyId/Faculty Id to standardized facultyIds array
const normalizeCoursesSchema = async (req, res) => {
  try {
    const coursesSnap = await db.collection("courses").get();

    if (coursesSnap.empty) {
      return res.json({ message: "No courses to normalize", count: 0 });
    }

    const updates = [];
    let normalizedCount = 0;

    for (const doc of coursesSnap.docs) {
      const course = doc.data();
      const courseId = pickFirstString(course, ["courseId", "Course Code", "courseCode", "CourseCode"]);

      // Check if already normalized
      if (Array.isArray(course.facultyIds) && course.facultyIds.length > 0) {
        continue; // Already normalized
      }

      // Extract faculty IDs from old schema
      let facultyIds = [];
      if (course.facultyId && typeof course.facultyId === 'string') {
        facultyIds.push(course.facultyId);
      } else if (course["Faculty Id"] && typeof course["Faculty Id"] === 'string') {
        facultyIds.push(course["Faculty Id"]);
      }

      if (facultyIds.length === 0) {
        console.warn(`⚠️ Course ${courseId} has no faculty assignment. Skipping.`);
        continue;
      }

      // Update the course doc with normalized schema
      updates.push(
        doc.ref.update({
          facultyIds: facultyIds,
          // Optionally remove old fields (commented out for safety)
          // facultyId: db.FieldValue.delete(),
          // "Faculty Id": db.FieldValue.delete(),
        })
      );
      normalizedCount++;
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return res.json({
      message: `Normalized ${normalizedCount} course(s)`,
      count: normalizedCount,
      totalCourses: coursesSnap.size
    });
  } catch (error) {
    console.error("normalizeCoursesSchema error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Return list of students for a branch/semester/section (admin)
const getStudentsList = async (req, res) => {
  try {
    const { branchId, semester, section } = req.query;
    if (!branchId) return res.status(400).json({ error: "branchId required" });

    let studentQuery = db.collection("students").where("branchId", "==", branchId);
    if (semester) studentQuery = studentQuery.where("semester", "==", semester);
    if (section) studentQuery = studentQuery.where("section", "==", section);

    const snap = await studentQuery.get();
    if (snap.empty) return res.json({ students: [] });

    const students = snap.docs.map(doc => {
      const s = doc.data();
      return {
        studentId: s.studentId,
        studentName: s.studentName || s.name || "",
        rollNumber: s.rollNumber || "",
        branchId: s.branchId || "",
        semester: s.semester || "",
        section: s.section || ""
      };
    });

    return res.json({ students });
  } catch (error) {
    console.error("getStudentsList error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// (exports consolidated at end of file)

const setFeedbackReportDates = async (req, res) => {
  try {
    const { academicYear, semester, phase1Date, phase2Date } = req.body;
    if (!academicYear || !semester) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const semesterKey = normalizeSemesterKey(semester);
    if (!semesterKey) {
      return res.status(400).json({ error: "Invalid semester value" });
    }
    if (!phase1Date && !phase2Date) {
      return res.status(400).json({ error: "At least one phase date required" });
    }
    // Ensure parent document exists
    await db.collection("feedbackreport").doc(academicYear).set({ createdAt: new Date() }, { merge: true });

    // Store phase1report and/or phase2report as documents in the semester subcollection
    const semesterRef = db.collection("feedbackreport").doc(academicYear).collection(semesterKey);
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

// Get or read the global Phase 2 activation flag (public)
const getPhaseActivation = async (req, res) => {
  try {
    const docRef = db.collection("settings").doc("phaseActivation");
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.json({ phase2Active: false });
    }
    const data = doc.data() || {};
    return res.json({
      phase2Active: !!data.phase2Active,
      updatedAt: data.updatedAt ? toIsoDate(data.updatedAt) : undefined,
    });
  } catch (error) {
    console.error("getPhaseActivation error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Set the global Phase 2 activation flag (admin only)
const setPhaseActivation = async (req, res) => {
  try {
    const { phase2Active } = req.body;
    if (typeof phase2Active !== "boolean") {
      return res.status(400).json({ error: "phase2Active must be a boolean" });
    }
    const docRef = db.collection("settings").doc("phaseActivation");
    await docRef.set({ phase2Active, updatedAt: new Date() }, { merge: true });
    return res.json({ success: true });
  } catch (error) {
    console.error("setPhaseActivation error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Get course-faculty pairs for a given branch/semester/section
const getCourseFacultyPairs = async (req, res) => {
  try {
    const { branchId, semester, section } = req.query;
    
    if (!branchId) {
      return res.status(400).json({ error: "branchId is required" });
    }

    let courseQuery = db.collection("courses").where("branchId", "==", branchId);

    if (semester) {
      courseQuery = courseQuery.where("semester", "==", semester);
    }

    if (section) {
      courseQuery = courseQuery.where("section", "==", section);
    }

    const courseSnap = await courseQuery.get();

    // Collect faculty IDs used in section-filtered courses
    const usedFacultyIds = new Set();
    courseSnap.forEach(doc => {
      const course = doc.data();
      if (Array.isArray(course.facultyIds)) {
        course.facultyIds.forEach(fId => {
          const normalizedFId = normalizeId(fId);
          if (normalizedFId) usedFacultyIds.add(normalizedFId);
        });
      }
    });

    // Load only faculties used in this section
    const facultySnap = await db.collection("faculties").get();
    const facultyMap = new Map();
    facultySnap.forEach(doc => {
      const faculty = doc.data();
      const facultyId = normalizeId(pickFirstString(faculty, ["facultyId", "Faculty Id", "FacultyID", "facultyID"]));
      if (facultyId && usedFacultyIds.has(facultyId)) {
        const facultyName = pickFirstString(faculty, ["facultyName", "FacultyName", "Faculty Name", "name", "Name"]) || "";
        facultyMap.set(facultyId, facultyName);
      }
    });

    const pairs = [];
    const pairDetails = [];
    const coursesMissingFacultyIds = [];

    courseSnap.forEach(doc => {
      const course = doc.data();
      const courseId = normalizeId(pickFirstString(course, ["courseId", "Course Code", "courseCode", "CourseCode"]));
      const courseName = pickFirstString(course, ["courseName", "Course Name", "CourseName", "name", "Name"]);

      // STRICT: Only accept normalized facultyIds array
      if (!Array.isArray(course.facultyIds) || course.facultyIds.length === 0) {
        coursesMissingFacultyIds.push(courseId);
        return; // Skip this course
      }

      course.facultyIds.forEach(fId => {
        const normalizedFacultyId = normalizeId(fId);
        if (normalizedFacultyId) {
          const pairKey = `${courseId}::${normalizedFacultyId}`;
          const facultyName = facultyMap.get(normalizedFacultyId) || "";
          pairs.push(pairKey);
          pairDetails.push({
            pairKey,
            courseId,
            courseName: courseName || "",
            facultyId: normalizedFacultyId,
            facultyName
          });
        }
      });
    });

    return res.json({
      pairs,
      pairDetails,
      count: pairs.length,
      coursesMissingFacultyIds,
      message: coursesMissingFacultyIds.length > 0 
        ? `⚠️ ${coursesMissingFacultyIds.length} course(s) missing facultyIds. Run normalize-courses to fix.`
        : "OK"
    });
  } catch (error) {
    console.error("getCourseFacultyPairs error:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAdminReport,
  getStudentFeedbackDetails,
  normalizeCoursesSchema,
  getStudentsList,
  getCourseFacultyPairs,
  logoutAdmin,
  verifyAdmin,
  loginAdmin,
  setFeedbackReportDates,
  getFeedbackReportDates,
  listFeedbackReportYears,
  getPhaseActivation,
  setPhaseActivation,
};