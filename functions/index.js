const {setGlobalOptions} = require("firebase-functions/v2/options");
const {onRequest} = require("firebase-functions/v2/https");
const {feedbackRouteHandler} = require("./src/routes/feedbackRoutes");

setGlobalOptions({maxInstances: 10});

exports.feedback = onRequest(
		{region: "asia-southeast1", cors: true},
		feedbackRouteHandler,
);
