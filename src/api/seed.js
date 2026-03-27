// seed.js
// Seed Firestore collections (students, faculties, courses)
// into the "student-feedback" Firestore database

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

/* -------------------------------- */
/* Fix __dirname for ES Modules */
/* -------------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------- */
/* Load Service Account */
/* -------------------------------- */

let serviceAccount;

try {
  const mod = await import("./serviceAccountKey.json", {
    assert: { type: "json" }
  });
  serviceAccount = mod.default;
} catch (err) {
  serviceAccount = JSON.parse(
    readFileSync(new URL("./serviceAccountKey.json", import.meta.url)).toString()
  );
}

/* -------------------------------- */
/* Initialize Firebase */
/* -------------------------------- */

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/* -------------------------------- */
/* Connect to specific database */
/* -------------------------------- */

const db = getFirestore("student-feedback");

/* -------------------------------- */
/* CSV directory */
/* -------------------------------- */

const csvDir = path.join(__dirname, "../csv");

/* -------------------------------- */
/* Collections to import */
/* -------------------------------- */

const collections = [
  {
    name: "students",
    file: "student.csv",
    idField: "studentId"
  },
  {
    name: "faculties",
    file: "faculty.csv",
    idField: "facultyId"
  },
  {
    name: "courses",
    file: "course.csv",
    idField: "courseId"
  }
];

/* -------------------------------- */
/* Import CSV into Firestore */
/* -------------------------------- */


function transformData(collectionName, row) {
  switch (collectionName) {
    case "students":
      return {
        studentId: row["Roll Number"],
        rollNumber: row["Roll Number"],
        name: row["Name"],
        email: row["Email"],
        branchId: row["Branch Id"],
        section: row["Section"],
        semester: row["Semester"]
      };
    case "faculties":
      return {
        facultyId: row["Faculty Id"],
        facultyName: row["FacultyName"],
        email: row["Email"],
        designation: row["Designation"],
        branchId: row["Branch Id"],
        subjectId: row["Subject Id"]
      };
    case "courses":
      return {
        courseId: row["Course Id"],
        courseName: row["Course Name"],
        branchId: row["Branch Id"],
        facultyId: row["Faculty Id"],
        semester: row["Semester"],
        credits: Number(row["Credits"])
      };
    default:
      return row;
  }
}

function importCollection({ name, file, idField }) {
  return new Promise((resolve, reject) => {
    const results = [];
    const filePath = path.join(csvDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`CSV file not found: ${filePath}`);
      return reject();
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        console.log(`Importing ${results.length} records into ${name}...`);
        const batch = db.batch();
        for (const row of results) {
          try {
            // Map and convert types
            const cleanData = transformData(name, row);
            const docId = cleanData[idField];
            if (!docId) continue;
            const ref = db.collection(name).doc(docId);
            batch.set(ref, cleanData, { merge: true });
          } catch (err) {
            console.error(`Error processing ${name}:`, err);
          }
        }
        await batch.commit();
        console.log(`Finished importing ${name}`);
        resolve();
      })
      .on("error", reject);
  });
}

/* -------------------------------- */
/* Execute Import */
/* -------------------------------- */

(async () => {

  try {

    for (const col of collections) {
      await importCollection(col);
    }

    console.log("All collections imported successfully.");
    process.exit(0);

  } catch (err) {

    console.error("Import failed:", err);
    process.exit(1);

  }

})();