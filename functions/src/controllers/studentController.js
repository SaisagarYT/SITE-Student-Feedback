
const { getAuth } = require("firebase-admin/auth");
const { db } = require("../config/firebase");

/**
 * Handles Google authentication for students.
 * If the user exists in the 'students' collection, returns their data.
 * If not, expects required details to register the user.
 */
exports.authenticateStudent = async (req, res) => {
  try {
    const { idToken, userDetails } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    // Verify the ID token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const email = decodedToken.email;
    if (!email) {
      return res.status(400).json({ error: "Invalid token: no email" });
    }

    if (!userDetails) {
      // LOGIN: Check if a student exists with this email (as a field)
      const studentsSnap = await db.collection("students").where("email", "==", email).limit(1).get();
      if (!studentsSnap.empty) {
        // User already registered, return user data
        return res.status(200).json({ user: studentsSnap.docs[0].data(), registered: true });
      } else {
        // User not registered
        return res.status(200).json({ registered: false, message: "User not registered. Provide details to register." });
      }
    } else {
      // REGISTRATION: Use studentId as the document ID
      let studentId = userDetails.studentId;
      if (!studentId) {
        return res.status(400).json({ error: "Missing studentId in registration." });
      }
      studentId = studentId.trim();
      // Attach email to userDetails for future lookups
      await db.collection("students").doc(studentId).set({ ...userDetails, email });
      return res.status(201).json({ user: { ...userDetails, email }, registered: true });
    }
  } catch (error) {
    console.error("Student authentication error:", error);
    return res.status(500).json({ error: error.message });
  }
};
