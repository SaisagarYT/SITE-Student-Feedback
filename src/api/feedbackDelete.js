// deleteFeedback.js
// Deletes entire "feedback" collection from student-feedback DB

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

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
/* Delete Feedback Collection */
/* ----------------------------- */

async function deleteFeedbackCollection(batchSize = 500) {
  const collectionRef = db.collection("feedback");

  console.log("Deleting feedback collection...");

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();

    if (snapshot.empty) {
      console.log("Feedback collection deleted.");
      break;
    }

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
}

/* ----------------------------- */
/* Execute */
/* ----------------------------- */

(async () => {
  try {
    await deleteFeedbackCollection();
    process.exit(0);
  } catch (err) {
    console.error("Deletion failed:", err);
    process.exit(1);
  }
})();