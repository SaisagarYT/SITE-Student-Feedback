const { setGlobalOptions } = require("firebase-functions/v2/options");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const app = require("./src/app");

setGlobalOptions({ maxInstances: 10 });

const jwtSecret = defineSecret("HTTP_FEEDBACK_SECRET");
// i diclared the secrets globally to access.....
exports.feedback = onRequest(
  { region: "asia-southeast1", secrets: [jwtSecret] },
  (req, res) => {
    req.jwtSecret = jwtSecret.value();
    app(req, res);
  }
);
