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

async function deleteCoursesByBranch(branchId, batchSize = 500) {
  let query = db.collection("courses");
  if (branchId) {
    query = query.where("branchId", "==", branchId);
  }
  let deleted = 0;
  while (true) {
    const snapshot = await query.limit(batchSize).get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
    console.log(`Deleted ${deleted} course documents so far...`);
  }
  if (branchId) {
    console.log(`All course documents for branchId '${branchId}' deleted.`);
  } else {
    console.log("All course documents deleted.");
  }
}

// Get branchId from command line argument (optional)
const branchId = process.argv[2];
deleteCoursesByBranch(branchId).then(() => process.exit(0));
