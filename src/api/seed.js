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

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore("student-feedback");

const csvDir = path.join(__dirname, "../csv");

const collections = [
  { name: "students", file: "student.csv" },
  { name: "faculties", file: "faculty.csv" },
  { name: "courses", file: "course.csv" }
];

// ---------- TRANSFORM ----------
function transformData(collectionName, row) {
  switch (collectionName) {
    case "students":
      return {
        studentId: row["Roll Number"],
        rollNumber: row["Roll Number"],
        name: row["Name"],
        email: row["Email"],
        branchId: row["Branch"],
        section: row["Section"],
        semester: mapSemester(row["Semester"]),
        program: row["Program"] || ""
      };

    case "faculties":
      return {
        facultyId: row["Faculty Id"],
        facultyName: row["FacultyName"],
        email: row["Email"],
        designation: row["Designation"],
        branchId: row["Branch"],
        subjectId: row["Subject Id"],
        section: row["Section"] && row["Section"].trim() !== "" ? row["Section"] : "A",
        program: row["Program"] || ""
      };

    case "courses":
      return {
        courseId: row["Course Id"],
        courseName: row["Course Name"],
        branchId: row["Branch"],
        facultyId: row["Faculty Id"],
        semester: mapSemester(row["Semester"]),
        credits: Number(row["Credits"]) || 0,
        section: row["Section"] && row["Section"].trim() !== "" ? row["Section"] : "A"
      };

    default:
      return row;
  }
}

// ---------- RETRY LOGIC ----------
async function commitWithRetry(batch, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await batch.commit();
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Retrying batch commit (${i + 1})...`);
      await new Promise(res => setTimeout(res, 500 * (i + 1)));
    }
  }
}

// ---------- CACHE EXISTING DOCS ----------
async function preloadCache(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const cache = new Map();

  snapshot.forEach(doc => {
    const data = doc.data();

    if (collectionName === "students") {
      cache.set(data.studentId, doc.id);
    } else if (collectionName === "faculties") {
      cache.set(`${data.facultyId}_${data.subjectId}`, doc.id);
    } else if (collectionName === "courses") {
      cache.set(`${data.courseId}_${data.facultyId}`, doc.id);
    }
  });

  return cache;
}

async function importCollection({ name, file }) {
  return new Promise(async (resolve, reject) => {
    const filePath = path.join(csvDir, file);

    if (!fs.existsSync(filePath)) {
      console.error(`CSV file not found: ${filePath}`);
      return reject();
    }

    let imported = 0;
    const stream = fs.createReadStream(filePath).pipe(csv());

    // Defensive normalization helper
    const normalize = (obj) => {
      const out = {};
      for (const k in obj) {
        if (typeof obj[k] === 'string') {
          out[k] = obj[k].trim();
        } else {
          out[k] = obj[k];
        }
      }
      return out;
    };

    if (name === "faculties") {
      const promises = [];
      stream.on("data", (row) => {
        const docData = normalize({
          facultyId: row["Faculty Id"],
          facultyName: row["FacultyName"],
          subjectId: row["Subject Id"],
          email: row["Email"]?.replace(/,/g, ""),
          designation: row["Designation"],
          branchId: row["Branch"],
          section: row["Section"] || "A",
          program: row["Program"]
        });
        const p = db.collection("faculties").add(docData);
        promises.push(p);
      });
      stream.on("end", async () => {
        await Promise.all(promises);
        console.log("FINAL COUNT:", promises.length);
        resolve(promises.length);
      });
      stream.on("error", reject);
      return;
    }
    if (name === "students") {
      const promises = [];
      stream.on("data", (row) => {
        const docData = normalize({
          studentId: row["Roll Number"],
          rollNumber: row["Roll Number"],
          name: row["Name"],
          email: row["Email"],
          branchId: row["Branch"],
          section: row["Section"],
          semester: mapSemester(row["Semester"]),
          program: row["Program"] || ""
        });
        const p = db.collection("students").add(docData);
        promises.push(p);
      });
      stream.on("end", async () => {
        await Promise.all(promises);
        console.log("FINAL COUNT:", promises.length);
        resolve(promises.length);
      });
      stream.on("error", reject);
      return;
    }
    if (name === "courses") {
      const promises = [];
      stream.on("data", (row) => {
        const docData = normalize({
          courseId: row["Course Id"],
          courseName: row["Course Name"],
          branchId: row["Branch"],
          facultyId: row["Faculty Id"],
          semester: mapSemester(row["Semester"]),
          credits: Number(row["Credits"]) || 0,
          section: row["Section"] || "A"
        });
        const p = db.collection("courses").add(docData);
        promises.push(p);
      });
      stream.on("end", async () => {
        await Promise.all(promises);
        console.log("FINAL COUNT:", promises.length);
        resolve(promises.length);
      });
      stream.on("error", reject);
      return;
    }

    // fallback (should not be used)
    stream.on("data", async (row) => {
      stream.pause();
      try {
        const cleanData = transformData(name, row);
        if (!cleanData) {
          stream.resume();
          return;
        }
        await db.collection(name).add(cleanData);
        imported++;
      } catch (err) {
        console.error(`Error processing ${name}:`, err);
      }
      stream.resume();
    });

    stream.on("end", async () => {
      try {
        console.log(`Finished importing ${name}. Imported ${imported} documents.`);
        resolve(imported);
      } catch (err) {
        reject(err);
      }
    });

    stream.on("error", reject);
  });
}

(async () => {
  try {
    console.log("Starting import...");

    // Parallel execution (controlled)
    const importCounts = {};
    for (const col of collections) {
      importCounts[col.name] = await importCollection(col);
    }

    console.log("\nSummary of imported documents:");
    for (const [name, count] of Object.entries(importCounts)) {
      console.log(`${name}: ${count}`);
    }

    console.log("All collections imported successfully.");
    process.exit(0);

  } catch (err) {
    console.error("Import failed:", err);
    process.exit(1);
  }
})();