const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb"); 
// localhost -> 127.0.0.1
exports.uri = "mongodb://127.0.0.1:27017";
exports.client = new MongoClient(exports.uri);

exports.mongoDataBase = "project";
exports.userDataCollection = "userData";
exports.videoDataCollection = "videoData";

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
exports.getDocData = async function(dataBase, collection, query, options, callback_argData)
{
    try {        
        await exports.client.connect();
        data = await exports.client.db(dataBase).collection(collection).findOne(query, options);
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

// Retrieves a set of data from the database and passes it to a callback function
exports.getMultiDocData = async function(dataBase, collection, query, options, callback_argData)
{
    try {        
        await exports.client.connect();
        cursor = await exports.client.db(dataBase).collection(collection).find(query, options);
        console.log("Database Fetch:");
        
        data = await cursor.toArray();
        console.log(data);
        
        console.log("Database Fetch End:"); 
    } finally {
        await cursor.close();
        await exports.client.close();        
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
// User Database wrappers 
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

        "accountType" : "viewer",
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
    query = {"username": username};
    options = {}; // None
    exports.getDocData(exports.mongoDataBase, exports.userDataCollection, query, options, callback_argData);
}

// Gets the user's field data
exports.getUserFieldData = function(username, fieldNameString, callback_argData)
{
    query = {"username": username};
    exports.getFieldData(exports.mongoDataBase, exports.userDataCollection, fieldNameString, query, callback_argData);
}

// Edits a field within a user Account in the database
exports.editUserFieldData = async function(username, fieldNameString, newValue, callback_argNone)
{
    query = {"username":username};
    exports.editFieldData(exports.mongoDataBase, exports.userDataCollection, query, fieldNameString, newValue, callback_argNone)
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




// ################################################################################
// Video Database wrappers 
// ################################################################################


// Adds the user's data to the database
exports.addNewVideo = function(formData)
{
    // Video data
    const videoUploader = formData.txtVideoUploader || '';
    const videoName = formData.txtVideoName || '';
    const videoGenre = formData.txtVideoGenre || '';
    const videoComment = formData.txtVideoComment || '';
    const videoEmbedLink = formData.txtVideoEmbedLink || '';
    const videoThumbnail = formData.txtVideoThumbnail || '';
    const videoLength = formData.txtVideoLength || '';

    newVideoData = { 
        "videoUploader" : videoUploader, 
        "videoName" : videoName,
        "videoGenre" : videoGenre,
        "videoComment" : videoComment,
        "videoEmbedLink" : videoEmbedLink,
        "videoThumbnail" : videoThumbnail, 
        "videoLength" : videoLength,
        "videoViewCount" : 0 // No one has viewed the video yet
    };   

    exports.addData(exports.mongoDataBase, exports.videoDataCollection, newVideoData, function(){console.log("New video added to server");})
}

// Finds videos based on text search of the videoName and text search of genres
exports.getVideos = function(searchParamName, searchParamGenre, callback_argData)
{
    // Query: 
    //   this -> document
    //   videoName/videoGenre -> field
    //   make this.videoname a string and search its contents for substring in variable searchParam
    //   If the location is not -1 (-1 = not present) then return the document

    // Make search filter
    var search = `JSON.stringify(this.videoName).toLowerCase().indexOf(('${searchParamName}').toLowerCase())!=-1`
    var genres = searchParamGenre.split(' ');
    genres.forEach(genre => {
        search += `&& JSON.stringify(this.videoGenre).toLowerCase().indexOf(('${genre}').toLowerCase())!=-1`;
    });
                  
    // Prepare query
    query = {$where: search};
    options = {
        projection: { _id: 0 }, // 0 means don't show
        sort : { "videoName": 1 } // Sort alphabetically (1 = ascending)
    };    
    
    // Conduct search
    exports.getMultiDocData(exports.mongoDataBase, exports.videoDataCollection, query, options, callback_argData);    
}

exports.getVideoData = function(name, callback_argData)
{
    query = {"videoName": name};
    options = {};
    // Issue: 2 videos have the same name
    exports.getDocData(exports.mongoDataBase, exports.videoDataCollection, query, options, callback_argData);
}
