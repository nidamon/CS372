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

// Removes a document from the specified database and collection that matches the filter
exports.removeData = async function(dataBase, collection, filter, callback_argNone = null)
{
    try {        
        await exports.client.connect();
        await exports.client.db(dataBase).collection(collection).deleteOne(filter);            
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
        console.log("Database Fetch:");     
        await exports.client.connect();
        data = await exports.client.db(dataBase).collection(collection).distinct(fieldNameString, query); 
        console.log(data);        
    } catch(err) {
        console.log("Database Fetch Failed:");  
        throw(err);  
    } finally {
        await exports.client.close()
        console.log("Database Fetch End:"); 
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
        callback_argData(data); 
    }
}

// Retrieves a set of data from the database and passes it to a callback function
exports.getMultiDocData = async function(dataBase, collection, query, options, callback_argData)
{
    try {        
        const client = await exports.client.connect();
        const cursor = await exports.client.db(dataBase).collection(collection).find(query, options);
        console.log("Database Fetch:");
        
        const data = await cursor.toArray();
        console.log(data);
        
        console.log("Database Fetch End:");

        await cursor.close();
        await client.close();

        callback_argData(data);
    } catch(err) {
        console.error(err);
        if (client) {
            await client.close();
        }
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
    newUserData = { 
        "username" : formData.txtUsername || '', 
        "password" : formData.txtPassword || '',
        "firstName" : formData.txtFirstName || '', 
        "lastName" : formData.txtLastName || '', 
        "email" : formData.txtEmail || '', 

        "securityQuestions": {
            "securityQ1" : formData.txtSecureQ1 || '', 
            "securityQ1Ans" : formData.txtSecureQ1Ans || '', 
            "securityQ2" : formData.txtSecureQ2 || '', 
            "securityQ2Ans" : formData.txtSecureQ2Ans || '', 
            "securityQ3" : formData.txtSecureQ3 || '', 
            "securityQ3Ans" : formData.txtSecureQ3Ans || ''
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


// Adds the video's data to the database
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
        "videoViewCount" : 0, // No one has viewed the video yet
        "videoFeedback" : "No feedback yet"
    };   

    exports.addData(exports.mongoDataBase, exports.videoDataCollection, newVideoData, function(){console.log("New video added to server");})
}

// Edits a field within a video's data in the database
exports.editVideoFieldData = async function(videoName, fieldNameString, newValue, callback_argNone)
{
    query = { "videoName" : videoName };
    exports.editFieldData(exports.mongoDataBase, exports.videoDataCollection, query, fieldNameString, newValue, callback_argNone)
}

// Removes the video with the matching name
exports.removeVideo = function(videoName, callback_argNone)
{
    filter = { "videoName" : videoName };
    exports.removeData(exports.mongoDataBase, exports.videoDataCollection, filter, callback_argNone);
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

// Gets a specific video's data
exports.getVideoData = function(name, callback_argData)
{
    query = {"videoName": name};
    options = {};
    // Issue: 2 videos have the same name
    exports.getDocData(exports.mongoDataBase, exports.videoDataCollection, query, options, callback_argData);
}
