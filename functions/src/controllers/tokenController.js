const { getAuth } = require("firebase-admin/auth");

/**
 * POST /api/verify-token
 * Verifies a Firebase ID token and returns { valid: true/false }
 */
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ valid: false, error: "Missing token" });
    }
    try {
      const decoded = await getAuth().verifyIdToken(token);
      return res.status(200).json({ valid: true });
    } catch (err) {
      return res.status(401).json({ valid: false, error: err.message });
    }
  } catch (error) {
    return res.status(500).json({ valid: false, error: error.message });
  }
};
