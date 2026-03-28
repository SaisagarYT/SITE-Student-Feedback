// seed.js
// Seed Firestore collections using AUTO-GENERATED document IDs

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

/* ----------------------------- */
/* Fix __dirname (ESM) */
/* ----------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ----------------------------- */
/* Load Service Account */
/* ----------------------------- */

let serviceAccount;

try {
  const mod = await import("./serviceAccountKey.json", {
    assert: { type: "json" }
  });
  serviceAccount = mod.default;
} catch {
  serviceAccount = JSON.parse(
    readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
  );
}

/* ----------------------------- */
/* Initialize Firebase */
/* ----------------------------- */

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/* ----------------------------- */
/* Connect to DB */
/* ----------------------------- */

const db = getFirestore("student-feedback");

/* ----------------------------- */
/* CSV directory */
/* ----------------------------- */

const csvDir = path.join(__dirname, "../csv");

/* ----------------------------- */
/* Collections */
/* ----------------------------- */

const collections = [
  { name: "students", file: "student.csv" },
  { name: "faculties", file: "faculty.csv" },
  { name: "courses", file: "course.csv" }
];

/* ----------------------------- */
/* Transform Data */
/* ----------------------------- */

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
        semester: Number(row["Semester"])
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
        semester: Number(row["Semester"]),
        credits: Number(row["Credits"])
      };

    default:
      return row;
  }
}

/* ----------------------------- */
/* Import Function */
/* ----------------------------- */

function importCollection({ name, file }) {
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

        const batchSize = 500;
        let batch = db.batch();
        let counter = 0;

        for (const row of results) {
          try {

            const cleanData = transformData(name, row);

            // AUTO-GENERATED ID
            const docRef = db.collection(name).doc();

            batch.set(docRef, cleanData);
            counter++;

            if (counter === batchSize) {
              await batch.commit();
              batch = db.batch();
              counter = 0;
            }

          } catch (err) {
            console.error(`Error in ${name}:`, err);
          }
        }

        if (counter > 0) {
          await batch.commit();
        }

        console.log(`Finished importing ${name}`);
        resolve();
      })

      .on("error", reject);
  });
}

/* ----------------------------- */
/* Execute */
/* ----------------------------- */

(async () => {
  try {

    console.log("Starting import...");

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