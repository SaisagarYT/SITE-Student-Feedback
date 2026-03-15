const { getAuth } = require("firebase-admin/auth");

/**
 * Admin authentication endpoint.
 * Verifies idToken, checks for admin claim or email in allowed list.
 * Returns admin data if authenticated.
 */
const ADMIN_EMAILS = [
  // Add allowed admin emails here
  "admin@example.com"
];

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
    // Option 1: Check for custom admin claim
    if (decodedToken.admin === true) {
      return res.status(200).json({ admin: { email }, authenticated: true });
    }
    // Option 2: Check if email is in allowed admin list
    if (ADMIN_EMAILS.includes(email)) {
      return res.status(200).json({ admin: { email }, authenticated: true });
    }
    return res.status(403).json({ error: "Not an admin user" });
  } catch (error) {
    console.error("Admin authentication error:", error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { authenticateAdmin };
