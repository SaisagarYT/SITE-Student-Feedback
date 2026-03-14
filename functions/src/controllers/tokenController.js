const { getAuth } = require("firebase-admin/auth");

/**
 * POST /api/verify-token
 * Verifies a Firebase ID token and returns { valid: true/false }
 */
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    console.log("[verifyToken] Received token:", token ? token.substring(0, 12) + '...' : 'none');
    if (!token) {
      console.log("[verifyToken] No token provided");
      return res.status(400).json({ valid: false, error: "Missing token" });
    }
    try {
      const decoded = await getAuth().verifyIdToken(token);
      console.log("[verifyToken] Token valid for UID:", decoded.uid);
      return res.status(200).json({ valid: true });
    } catch (err) {
      console.log("[verifyToken] Invalid token:", err.message);
      return res.status(401).json({ valid: false, error: err.message });
    }
  } catch (error) {
    console.log("[verifyToken] Unexpected error:", error.message);
    return res.status(500).json({ valid: false, error: error.message });
  }
};
