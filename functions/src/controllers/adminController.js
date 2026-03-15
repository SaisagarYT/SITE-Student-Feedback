const { getAuth } = require("firebase-admin/auth");
const { db } = require("../config/firebase");

/**
 * Admin authentication endpoint.
 * Verifies idToken, checks if email exists in 'admins' collection.
 * Returns admin data if authenticated.
 */
async function authenticateAdmin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }
    // Verify the ID token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const email = decodedToken.email;
    if (!email) {
      return res.status(400).json({ error: "Invalid token: no email" });
    }
    // Check if email exists in 'admins' collection
    const adminSnap = await db.collection("admins").where("email", "==", email).limit(1).get();
    if (!adminSnap.empty) {
      const adminData = adminSnap.docs[0].data();
      return res.status(200).json({ admin: adminData, authenticated: true });
    }
    return res.status(403).json({ error: "Not an admin user" });
  } catch (error) {
    console.error("Admin authentication error:", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Fetch all student feedbacks for admin dashboard.
 * Returns an array of feedback documents, each with email and submitted phases.
 */
async function getAllStudentFeedbacks(req, res) {
  try {
    const feedbackSnap = await db.collection("feedback").get();
    const feedbacks = [];
    feedbackSnap.forEach(doc => {
      const data = doc.data();
      // Each doc: { email, phase1?, phase2? }
      feedbacks.push({
        email: data.email,
        phase1: data.phase1 || null,
        phase2: data.phase2 || null
      });
    });
    res.status(200).json({ feedbacks });
  } catch (error) {
    console.error("Failed to fetch student feedbacks", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Admin logout endpoint.
 * Verifies idToken and returns success (stateless, for client cleanup).
 */
async function logoutAdmin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }
    // Optionally verify the token (stateless logout)
    await getAuth().verifyIdToken(idToken);
    // No server session to destroy; just acknowledge
    return res.status(200).json({ success: true, message: "Admin logged out." });
  } catch (error) {
    console.error("Admin logout error:", error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { authenticateAdmin, getAllStudentFeedbacks, logoutAdmin };
