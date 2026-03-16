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
    file: "student_mock_data.csv",
    idField: "studentId"
  },
  {
    name: "faculties",
    file: "faculty_mock_data.csv",
    idField: "facultyId"
  },
  {
    name: "courses",
    file: "courses_mock_data.csv",
    idField: "courseId"
  }
];

/* -------------------------------- */
/* Import CSV into Firestore */
/* -------------------------------- */

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

        for (const row of results) {

          try {

            const docId = row[idField];

            if (docId) {
              await db.collection(name).doc(docId).set(row, { merge: true });
            } else {
              await db.collection(name).add(row);
            }

          } catch (err) {
            console.error(`Error inserting into ${name}:`, err);
          }
        }
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