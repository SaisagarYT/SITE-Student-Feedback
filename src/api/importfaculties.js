import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account
const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore("student-feedback");

const csvPath = path.join(__dirname, "../csv/faculty.csv");

function getCsvValue(row, keys, fallback = "") {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
}

function getProgramValue(row) {
  return getCsvValue(row, [
    "Program",
    "Program (B.Tech / M.Tech / MBA / Deploma)",
    "Program (B.Tech / M.Tech / MBA / Deploma"
  ], "");
}

function transformFaculty(row) {
  return {
    facultyId: getCsvValue(row, ["Faculty Id"]),
    facultyName: getCsvValue(row, ["FacultyName", "Faculty Name"]),
    email: getCsvValue(row, ["Email", "Faculty Email"]),
    designation: getCsvValue(row, ["Designation"]),
    branchId: getCsvValue(row, ["Branch"]),
    subjectId: getCsvValue(row, ["Subject Id", "Coure Code", "Course Code"]),
    section: getCsvValue(row, ["Section", "Sec", "Year/Section"], "A"),
    program: getProgramValue(row)
  };
}

async function importFaculties() {
  const results = [];
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      let imported = 0;
      for (const row of results) {
        const cleanData = transformFaculty(row);
        // Check for existing doc with same facultyId, subjectId, and section
        const snap = await db.collection("faculties")
          .where("facultyId", "==", cleanData.facultyId)
          .where("subjectId", "==", cleanData.subjectId)
          .where("section", "==", cleanData.section)
          .limit(1).get();
        let docRef;
        if (!snap.empty) {
          docRef = db.collection("faculties").doc(snap.docs[0].id);
        } else {
          docRef = db.collection("faculties").doc();
        }
        await docRef.set(cleanData, { merge: true });
        imported++;
      }
      console.log(`Imported/updated ${imported} faculty records.`);
      process.exit(0);
    })
    .on("error", (err) => {
      console.error("Error reading CSV:", err);
      process.exit(1);
    });
}

importFaculties();
