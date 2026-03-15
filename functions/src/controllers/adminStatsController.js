const { db } = require("../config/firebase");
const { FEEDBACK_COLLECTION } = require("../models/feedbackModel");

async function getDashboardStats(req, res) {
  try {
    const snapshot = await db.collection(FEEDBACK_COLLECTION).get();
    let total = 0;
    let phase1Count = 0;
    let phase2Count = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    snapshot.forEach(doc => {
      total++;
      const data = doc.data();
      if (data.phase1 && data.phase1.ratings) {
        phase1Count++;
        Object.values(data.phase1.ratings).forEach(val => {
          if (typeof val === "number") {
            ratingSum += val;
            ratingCount++;
          }
        });
      }
      if (data.phase2 && data.phase2.ratings) {
        phase2Count++;
        Object.values(data.phase2.ratings).forEach(val => {
          if (typeof val === "number") {
            ratingSum += val;
            ratingCount++;
          }
        });
      }
    });
    const avgRating = ratingCount ? (ratingSum / ratingCount) : 0;
    res.json({
      totalSubmissions: total,
      phase1Count,
      phase2Count,
      averageRating: Number(avgRating.toFixed(2)),
    });
  } catch (error) {
    console.error("Failed to get dashboard stats", error);
    res.status(500).json({ message: "Failed to get dashboard stats." });
  }
}

module.exports = { getDashboardStats };