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

module.exports = { authenticateAdmin };
