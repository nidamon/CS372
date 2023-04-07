const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb"); 
exports.uri = "mongodb://127.0.0.1:27017";
exports.client = new MongoClient(exports.uri);

exports.mongoDataBase = "project";
exports.userDataCollection = "userData";
exports.videoDataCollection = "videoData";
exports.genreDataCollection = "genreData";

// ################################################################################
// MongoDB Client Connection and Client Closing 
// ################################################################################

// Calls closeDatabaseConnection function upon proper
// closing of node.js server
process.on('SIGINT', closeDatabaseConnection);
process.on('SIGTERM', closeDatabaseConnection);

// Connect to the database when the module is loaded
(async () => {
    try {
        await exports.client.connect();
        console.log('MongoDB connection established.');
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
})();
// Close mongoDB client connection 
async function closeDatabaseConnection() {
    try {
        await exports.client.close();
        console.log('MongoDB connection closed.');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    } finally {
        process.exit(0);
    }
}
    
// ################################################################################
// Database communication
// ################################################################################

// Adds the document into the collection within the given dataBase
exports.addData = async function(dataBase, collection, document, callback_argNone = null)
{
    try {        
        await exports.client.db(dataBase).collection(collection).insertOne(document);            
    } finally {
        if(callback_argNone != null)
            callback_argNone();    
    }
}
// Adds the document into the collection within the given dataBase if the document is not already in the database
exports.addDataIfNotPresent = async function(dataBase, collection, checkField, checkFieldValue, document, callback_argNone = null)
{
    try {        
        await exports.client.db(dataBase).collection(collection).updateOne(
            {[checkField]: checkFieldValue},
            {$setOnInsert: document},
            {upsert: true}
        );            
    } finally {
        if(callback_argNone != null)
            callback_argNone();    
    }
}
// Removes a document from the specified database and collection that matches the filter
exports.removeData = async function(dataBase, collection, filter, callback_argNone = null)
{
    try {        
        await exports.client.db(dataBase).collection(collection).deleteOne(filter);            
    } finally {
        if(callback_argNone != null)
            callback_argNone();    
    }
}
// Retrieves field data from a document in the database and passes it to a callback function
exports.getFieldData = async function(dataBase, collection, fieldNameString, query, callback_argFieldData)
{
    try {        
        console.log("Database Fetch:");     
        data = await exports.client.db(dataBase).collection(collection).distinct(fieldNameString, query); 
        console.log(data);        
    } catch(err) {
        console.log("Database Fetch Failed:");  
        throw(err);  
    } finally {
        console.log("Database Fetch End:"); 
        if(data != null)
            callback_argFieldData(data[0]);  
        else
            callback_argFieldData(data);
    }
}
// Retrieves data from the database and passes it to a callback function
exports.getDocData = async function (dataBase, collection, query, options, callback_argData) {
    try {
        // Create a new MongoClient for each operation

        const data = await exports.client.db(dataBase).collection(collection).findOne(query, options);
        console.log("Database Fetch:");
        console.log(data);
        console.log("Database Fetch End:");


        callback_argData(data);
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}
// Retrieves a set of data from the database and passes it to a callback function
exports.getMultiDocData = async function(dataBase, collection, query, options, callback_argData)
{
    try {        

        const cursor = await exports.client.db(dataBase).collection(collection).find(query, options);
        console.log("Database Fetch:");
        
        const data = await cursor.toArray();
        console.log(data);
        
        console.log("Database Fetch End:");

        await cursor.close();

        callback_argData(data);
    } catch(err) {
        console.error("Error fetching data:", err);
    }
}
// Edits a field within a document in the database
exports.editFieldData = async function(dataBase, collection, query, fieldNameString, newValue, callback_argNone = null)
{
    try {        
        await exports.client.db(dataBase).collection(collection).updateOne(
            query,
            {
                $set: {
                    [fieldNameString] : newValue
                }
            }
            );
    } finally {
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
    options = {};
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
        "videoViewCount" : 0,
        "videoFeedback" : "No feedback yet"
    };   

    exports.addNewGenres(videoGenre);
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
    //   make this.videoName a string and search its contents for substring in variable searchParam
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
exports.getVideoData = function(videoName, callback_argData)
{
    query = {"videoName": videoName};
    options = {};
    exports.getDocData(exports.mongoDataBase, exports.videoDataCollection, query, options, callback_argData);
}
// Gets a specific video's field data
exports.getVideoFieldData = function(videoName, fieldNameString, callback_argData)
{
    query = {"videoName": videoName};
    exports.getFieldData(exports.mongoDataBase, exports.videoDataCollection, fieldNameString, query, callback_argData);
}

// ################################################################################
// Genre Database wrappers 
// ################################################################################

// Adds new genres if not already present
exports.addNewGenres = function(videoGenres)
{    
    genreList = videoGenres.split(' ');
    genreList.forEach(possibleNewGenre => {
        if(/^ *$/.test(possibleNewGenre) == false) { // NOT Only white space and NOT empty
            newGenreData = { 
                "genreName" : possibleNewGenre
            };   

            let checkField = "genreName";
            let checkFieldValue = possibleNewGenre;
            exports.addDataIfNotPresent(exports.mongoDataBase, exports.genreDataCollection, checkField, checkFieldValue, newGenreData, function(){console.log("New video added to server");})
        }
    });
}
// Gets all genres
exports.getGenres = function(callback_argGenres)
{
    query = {};
    options = {
        projection: { _id: 0 }, // 0 means don't show
        sort : { "genreName": 1 } // Sort alphabetically (1 = ascending)
    };    
    exports.getMultiDocData(exports.mongoDataBase, exports.genreDataCollection, query, options, function(genreDocList){
        let genresList = [];
        genreDocList.forEach(genreDoc => { // Fill genresList with genreName field data only
            genresList.push(genreDoc.genreName);
        });
        callback_argGenres(genresList);
    });    
}
