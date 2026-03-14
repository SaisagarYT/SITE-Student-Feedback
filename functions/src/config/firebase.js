const {initializeApp, getApps} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp();
}

// Use (default) database in the local emulator; named DB in production
const db = process.env.FIRESTORE_EMULATOR_HOST
  ? getFirestore()
  : getFirestore("student-feedback");

module.exports = {db};
