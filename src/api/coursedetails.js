import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Load service account
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// IMPORTANT: select your database
const db = getFirestore("student-feedback");

// Function to fetch courses by branchId
async function getCoursesByBranchId(branchId) {
  try {
    const snapshot = await db
      .collection("courses")
      .where("branchId", "==", branchId)
      .get();

    if (snapshot.empty) {
      console.log(`No courses found for branchId: ${branchId}`);
      return [];
    }

    const courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Found ${courses.length} course(s) for branchId: ${branchId}`);
    console.log(courses);
    return courses;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Pass branchId dynamically from CLI arg
const branchId = process.argv[2];

if (!branchId) {
  console.error("Usage: node coursedetails.js <branchId>");
  process.exit(1);
}

getCoursesByBranchId(branchId).then(() => process.exit(0));
