import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore("student-feedback");

async function deleteByBranch(collectionName, branchId, batchSize = 500) {
  let deleted = 0;

  while (true) {
    const snapshot = await db
      .collection(collectionName)
      .where("branchId", "==", branchId)
      .limit(batchSize)
      .get();

    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    deleted += snapshot.size;
    console.log(`[${collectionName}] deleted so far: ${deleted}`);
  }

  return deleted;
}

async function main() {
  const branchId = process.argv[2];

  if (!branchId) {
    console.error("Usage: node deletebranch.js <branchId>");
    process.exit(1);
  }

  try {
    console.log(`Starting deletion for branchId: ${branchId}`);

    const collections = ["students", "faculties", "courses"];
    let totalDeleted = 0;

    for (const collectionName of collections) {
      const count = await deleteByBranch(collectionName, branchId);
      totalDeleted += count;
      console.log(`[${collectionName}] total deleted: ${count}`);
    }

    console.log(`Done. Total documents deleted for '${branchId}': ${totalDeleted}`);
    process.exit(0);
  } catch (error) {
    console.error("Deletion failed:", error);
    process.exit(1);
  }
}

main();