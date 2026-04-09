// deletestudents.js
// Deletes student documents from Firestore (student-feedback DB) based on branchId

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore("student-feedback");

async function deleteStudentsByBranch(branchId, batchSize = 500) {
  let query = db.collection("students");
  if (branchId) {
    query = query.where("branchId", "==", branchId);
  }

  while (true) {
    const snapshot = await query.limit(batchSize).get();
    if (snapshot.empty) {
      if (branchId) {
        console.log(`All student documents for branchId '${branchId}' deleted.`);
      } else {
        console.log("All student documents deleted.");
      }
      break;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

// Get branchId from command line argument (optional)
const branchId = process.argv[2];
deleteStudentsByBranch(branchId).then(() => process.exit(0));
