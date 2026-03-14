const {submitFeedback} = require("../controllers/feedbackController");

async function feedbackRouteHandler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({message: "Method not allowed. Use POST."});
    return;
  }

  await submitFeedback(req, res);
}

module.exports = {feedbackRouteHandler};
