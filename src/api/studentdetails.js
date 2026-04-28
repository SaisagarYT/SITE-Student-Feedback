import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Load service account
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// IMPORTANT: select your database
const db = getFirestore("student-feedback");

// Function to fetch student by email
async function getStudentByEmail(email) {
  try {
    const snapshot = await db
      .collection("students")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log("No student found");
      return null;
    }

    const doc = snapshot.docs[0];

    const student = {
      id: doc.id,
      ...doc.data(),
    };

    console.log("Student Found:", student);
    return student;

  } catch (error) {
    console.error("Error:", error);
  }
}

const email = process.argv[2]?.trim();

if (!email) {
  console.error("Usage: node studentdetails.js <student-email>");
  process.exit(1);
}

getStudentByEmail(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });