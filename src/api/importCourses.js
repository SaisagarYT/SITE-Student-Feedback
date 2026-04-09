

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

// Map semester values from sheet to desired format
function mapSemester(sem) {
  const mapping = {
    "I": "I-I", "II": "I-II", "III": "II-I", "IV": "II-II",
    "V": "III-I", "VI": "III-II", "VII": "IV-I", "VIII": "IV-II",
    "1": "I-I", "2": "I-II", "3": "II-I", "4": "II-II",
    "5": "III-I", "6": "III-II", "7": "IV-I", "8": "IV-II",
    "1-1": "I-I", "1-2": "I-II", "2-1": "II-I", "2-2": "II-II",
    "3-1": "III-I", "3-2": "III-II", "4-1": "IV-I", "4-2": "IV-II"
  };
  if (!sem || typeof sem !== "string") return sem;
  const trimmed = sem.trim().toUpperCase();
  return mapping[trimmed] || trimmed;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore("student-feedback");

const csvFilePath = path.join(__dirname, "../csv/course.csv");

async function importCourses() {
  const courses = [];
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    process.exit(1);
  }
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => courses.push(row))
    .on("end", async () => {
      console.log(`Read ${courses.length} rows from CSV.`);
      let imported = 0;
      for (const row of courses) {
        const courseId = row["Course Id"];
        const facultyId = row["Faculty Id"];
        let section = row["Section"] && row["Section"].trim() !== "" ? row["Section"] : "A";
        const semester = mapSemester(row["Semester"]);
        if (!courseId || !facultyId) continue;
        // Check for existing doc with same courseId, facultyId, section, and semester
        const snap = await db.collection("courses")
          .where("courseId", "==", courseId)
          .where("facultyId", "==", facultyId)
          .where("section", "==", section)
          .where("semester", "==", semester)
          .limit(1).get();
        let docRef;
        if (!snap.empty) {
          docRef = db.collection("courses").doc(snap.docs[0].id);
        } else {
          docRef = db.collection("courses").doc();
        }
        const docData = {
          courseId,
          courseName: row["Course Name"],
          branchId: row["Branch"],
          facultyId,
          semester,
          credits: Number(row["Credits"]) || 0,
          section
        };
        await docRef.set(docData, { merge: true });
        imported++;
        console.log(`Imported/updated: ${courseId}, ${facultyId}, ${section}, ${semester}`);
      }
      console.log(`Import complete! Imported/updated ${imported} course records.`);
      process.exit(0);
    })
    .on("error", (err) => {
      console.error("Error reading CSV:", err);
      process.exit(1);
    });
}

importCourses();
