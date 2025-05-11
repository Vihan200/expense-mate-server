const { MongoClient } = require("mongodb");

const mongoURI = process.env.MONGO_URI || "mongodb://vihanganirmitha200:HoneyBadgers@ac-w6sx0kt-shard-00-00.brbzcet.mongodb.net:27017,ac-w6sx0kt-shard-00-01.brbzcet.mongodb.net:27017,ac-w6sx0kt-shard-00-02.brbzcet.mongodb.net:27017/?replicaSet=atlas-roevg6-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=expenseCluster";
const client = new MongoClient(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

const connectToMongoDB = async () => {
  if (!db) {
    await client.connect();
    db = client.db("RAD");
    console.log("MongoDB connected successfully");
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectToMongoDB() first.");
  }
  return db;
};

module.exports = { connectToMongoDB, getDB };
