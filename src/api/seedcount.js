import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

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

async function countByBranch(branchId) {
  const collections = ["students", "faculties", "courses"];
  for (const col of collections) {
    let query = db.collection(col).where("branchId", "==", branchId);
    const snap = await query.get();
    console.log(`${col}: ${snap.size}`);
  }
}

// Get branchId from command line argument
const branchId = process.argv[2];
if (!branchId) {
  console.error("Usage: node seedcount.js <branchId>");
  process.exit(1);
}

countByBranch(branchId).then(() => process.exit(0));
