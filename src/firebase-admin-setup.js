const admin = require("firebase-admin");
const serviceAccount = require("../privateKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;