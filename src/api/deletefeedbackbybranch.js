import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore("student-feedback");

async function deleteFeedbackByBranch(branchId, batchSize = 500) {
  const collectionRef = db.collection("feedback");
  let totalDeleted = 0;

  while (true) {
    const snapshot = await collectionRef
      .where("branchId", "==", branchId)
      .limit(batchSize)
      .get();

    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    totalDeleted += snapshot.size;
    console.log(`[feedback] deleted so far: ${totalDeleted}`);
  }

  return totalDeleted;
}

async function main() {
  const branchId = process.argv[2];

  if (!branchId) {
    console.error("Usage: node deletefeedbackbybranch.js <branchId>");
    process.exit(1);
  }

  try {
    console.log(`Starting feedback deletion for branchId: ${branchId}`);
    const deletedCount = await deleteFeedbackByBranch(branchId);
    console.log(`Done. Total feedback documents deleted for '${branchId}': ${deletedCount}`);
    process.exit(0);
  } catch (error) {
    console.error("Deletion failed:", error);
    process.exit(1);
  }
}

main();
