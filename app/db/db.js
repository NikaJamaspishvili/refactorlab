import { MongoClient } from "mongodb";

const client = new MongoClient(
  "mongodb+srv://jamaspishvilinika12_db_user:iQan31QAIlWykCIB@cluster0.qmcbk0b.mongodb.net/?appName=Cluster0",
);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

// Call this only when your application terminates
export async function disconnectFromMongoDB() {
  await client.close();
}
