const {setGlobalOptions} = require("firebase-functions/v2/options");
const {onRequest} = require("firebase-functions/v2/https");
const {app} = require("./src/app");

setGlobalOptions({maxInstances: 10});

exports.feedback = onRequest(
  {region: "asia-southeast1", cors: true},
  app,
);
