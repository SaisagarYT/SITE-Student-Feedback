const express = require("express");
const {submitFeedback} = require("../controllers/feedbackController");

const feedbackRouter = express.Router();

feedbackRouter.post("/", submitFeedback);

feedbackRouter.all("/", (_req, res) => {
  res.status(405).json({message: "Method not allowed. Use POST."});
});

module.exports = {feedbackRouter};
