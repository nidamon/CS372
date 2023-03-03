// Import the MongoDB driver
const {MongoClient} = require("mongodb");

// MongoDB connection URI and database name
const uri = "mongodb://127.0.0.1:27017";
const dbName = "movieWebDB";
const collName = "users";

// Function to insert user data into the users collection
async function insertUser(firstName, lastName, username, password, email, sQ1, sA1, sQ2, sA2, sQ3, sA3) {
  // Create a new MongoClient
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB server
    await client.connect();

    // Access the users collection in the movieWebDB database
    const database = client.db(dbName);
    const collection = database.collection(collName);

    // Create a new user document
    const user = {
        firstName: firstName,
        lastName: lastName,
        username: username,
        password: password,
        email: email,
        sQ1: sQ1,
        sA1: sA1,
        sQ2: sQ2,
        sA2: sA2,
        sQ3: sQ3,
        sA3: sA3,
    };

    // Insert the user document into the users collection
    await collection.insertOne(user);

  } finally {
    // Close the MongoDB connection
    await client.close();
  }
}

// Export the insertUser function for use in other modules
module.exports = { insertUser };
