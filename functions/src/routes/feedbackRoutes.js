const express = require("express");
const { submitFeedback, getFeedbackByEmail } = require("../controllers/feedbackController");

const feedbackRouter = express.Router();


// POST / (submit feedback)
feedbackRouter.post("/", submitFeedback);

// GET /feedback?email=... (fetch feedback for a user)
feedbackRouter.get("/feedback", getFeedbackByEmail);

feedbackRouter.all("/", (_req, res) => {
  res.status(405).json({message: "Method not allowed. Use POST."});
});

module.exports = feedbackRouter;
