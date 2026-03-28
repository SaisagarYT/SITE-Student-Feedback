// deleteseed.js
// Deletes entire collections from Firestore (student-feedback DB)

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

/* ----------------------------- */
/* Fix __dirname (ESM) */
/* ----------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ----------------------------- */
/* Load Service Account */
/* ----------------------------- */

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

/* ----------------------------- */
/* Initialize Firebase */
/* ----------------------------- */

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/* ----------------------------- */
/* Connect to your DB */
/* ----------------------------- */

const db = getFirestore("student-feedback");

/* ----------------------------- */
/* Collections to delete */
/* ----------------------------- */

const collections = ["students", "faculties", "courses"];

/* ----------------------------- */
/* Delete Collection (batched) */
/* ----------------------------- */

async function deleteCollection(collectionName, batchSize = 500) {
  const collectionRef = db.collection(collectionName);

  console.log(`Deleting collection: ${collectionName}`);

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();

    if (snapshot.empty) {
      console.log(`Finished deleting ${collectionName}`);
      break;
    }

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
}

(async () => {
  try {
    console.log("Starting deletion...");

    for (const col of collections) {
      await deleteCollection(col);
    }

    console.log("All collections deleted successfully.");
    process.exit(0);

  } catch (err) {
    console.error("Deletion failed:", err);
    process.exit(1);
  }
})();