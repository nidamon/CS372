const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb"); 
// localhost -> 127.0.0.1
exports.uri = "mongodb://127.0.0.1:27017";
exports.client = new MongoClient(exports.uri);

exports.mongoDataBase = "project";
exports.userDataCollection = "userData";

// ################################################################################
// Database communication
// ################################################################################


// Adds the document into the collection within the given dataBase
exports.addData = async function(dataBase, collection, document, callback_argNone = null)
{
    try {        
        await exports.client.connect();
        await exports.client.db(dataBase).collection(collection).insertOne(document);            
    } finally {
        await exports.client.close();
        if(callback_argNone != null)
            callback_argNone();    
    }
}

// Retrieves field data from a document in the database and passes it to a callback function
exports.getFieldData = async function(dataBase, collection, fieldNameString, query, callback_argFieldData)
{
    try {        
        await exports.client.connect();
        data = await exports.client.db(dataBase).collection(collection).distinct(fieldNameString, query); 
        console.log("Database Fetch:"); 
        console.log(data);
        console.log("Database Fetch End:"); 
    } finally {
        await exports.client.close();
        if(data != null)
            callback_argFieldData(data[0]);  
        else
            callback_argFieldData(data);         
    }
}

// Retrieves data from the database and passes it to a callback function
exports.getDocData = async function(dataBase, collection, query, callback_argData)
{
    try {        
        await exports.client.connect();
        data = await exports.client.db(dataBase).collection(collection).findOne(query);
        console.log("Database Fetch:"); 
        console.log(data);
        console.log("Database Fetch End:"); 
    } finally {
        await exports.client.close();
        if(data != null)
            callback_argData(data[0]);  
        else
            callback_argData(data); 
    }
}

// Edits a field within a document in the database
exports.editFieldData = async function(dataBase, collection, query, fieldNameString, newValue, callback_argNone = null)
{
    try {        
        await exports.client.connect();
        await exports.client.db(dataBase).collection(collection).updateOne(
            query, // Used to find the document
            {
                $set: {
                    [fieldNameString] : newValue // Change value
                }
            }
            );
    } finally {
        await exports.client.close();
        if(callback_argNone != null)
            callback_argNone();    
    }
}



// ################################################################################
// Database wrappers 
// ################################################################################


// Adds the user's data to the database
exports.addNewUser = function(formData)
{
    // User data for account
    const username = formData.txtUsername || '';
    const password = formData.txtPassword || '';
    const firstName = formData.txtFirstName || '';
    const lastName = formData.txtLastName || '';
    const email = formData.txtEmail || '';

    const securityQ1 = formData.txtSecureQ1 || '';
    const securityQ1Ans = formData.txtSecureQ1Ans || '';
    const securityQ2 = formData.txtSecureQ2 || '';
    const securityQ2Ans = formData.txtSecureQ2Ans || '';
    const securityQ3 = formData.txtSecureQ3 || '';
    const securityQ3Ans = formData.txtSecureQ3Ans || '';

    newUserData = { 
        "username" : username, 
        "password" : password,
        "firstName" : firstName, 
        "lastName" : lastName, 
        "email" : email, 

        "securityQuestions": {
            "securityQ1" : securityQ1, 
            "securityQ1Ans" : securityQ1Ans, 
            "securityQ2" : securityQ2, 
            "securityQ2Ans" : securityQ2Ans, 
            "securityQ3" : securityQ3, 
            "securityQ3Ans" : securityQ3Ans
        },

        "loggedIn": "no",
        "locked": "no",
        "failedLogins": {
            "oldest": 0,
            "secondOldest": 0,
            "newest": 0
        }       
    };   
            
    exports.addData(exports.mongoDataBase, exports.userDataCollection, newUserData, function(){console.log("User data added to server");})
}

// Gets the user's data
exports.getUserData = function(username, callback_argData)
{
    exports.getDocData(exports.mongoDataBase, exports.userDataCollection, {"username": username}, callback_argData);
}

// Gets the user's field data
exports.getUserFieldData = function(username, fieldNameString, callback_argData)
{
    exports.getFieldData(exports.mongoDataBase, exports.userDataCollection, fieldNameString, {"username": username}, callback_argData);
}

// Edits a field within a user Account in the database
exports.editUserFieldData = async function(username, fieldNameString, newValue, callback_argNone)
{
    exports.editFieldData(exports.mongoDataBase, exports.userDataCollection, {"username":username}, fieldNameString, newValue, callback_argNone)
}

// Checks if the user exists
exports.doesUserExist = function(username, callback_argBool)
{
  exports.getUserFieldData(username, "username", function(data)
  {
    if(data != null)
        callback_argBool(true);
    else
        callback_argBool(false);
  });
}
