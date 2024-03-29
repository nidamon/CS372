var http = require('http');
var url = require('url');
var fs = require('fs');
const querystring = require('querystring');

var credentialModule = require('./credentialModule');
var dataBaseModule = require('./databaseModule');
var videoModule = require('./videoModule');

var port = 8080;

// Page names 

const homePage = 'home.html';
const loginPage = 'loginpage.html';
const signUpPage = 'signup.html';
const passwordResetPage = 'passwordreset.html';
const landingPage = 'landingpage';
const videoUploadPage = 'videoupload.html';
const invalidUserPage = 'notInMyHouse.html';

const chillflixStyleSheet = 'chillflixStyleSheet.css'

http.createServer(function (req, res) {
  var query = url.parse(req.url, true).pathname;
  console.log("Requested page: " + query);

  directOnRequest(query, req, res);
}).listen(port); 

// Handles the directing for queries
function directOnRequest(query, req, res) {
  baseQuery = query.split('/')[1];
  switch (baseQuery) {
    case '':
    case homePage: sendPagehtml(res, homePage); break;
    case loginPage: handleLoginPage(req, res); break;
    case 'logout': handleLogout(req, res); break;
    case signUpPage: handleSignUpPage(req, res); break;
    case passwordResetPage: handlePasswordResetPage(req, res); break;
    case landingPage: handleMoviesPage(req, res); break;
    case videoUploadPage: handleVideoUploadPage(req, res); break;
    case 'images': sendImage(res, "." + query); break; // Image request
    case 'users': handleUserInfoQuery(req, res); break; // Request about users
    case 'video': handleVideoPage(req, res); break; // Check if request about a video
    case 'genrelist': sendGenreList(req, res); break; // Request for genres
    case chillflixStyleSheet: sendStyleSheet(res, chillflixStyleSheet); break;
    case invalidUserPage: sendPagehtml(res, invalidUserPage); break;
    default: // No page available
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.end("There is no page at this address."); 
      break;
  }
}

// ######################################################################################
// Page handling 
// ######################################################################################


// Login page ###########################################################################

function handleLoginPage(req, res)
{
  if(req.method === 'GET')
  {
    sendPagehtml(res, loginPage);
  }
  else if (req.method === 'POST')
  {
    handleLoginSubmission(req, res);
  }
  else
  {
    console.log("req.method was neither GET nor POST.");
  }
}
// Handles a user's login submission by either notifying them of incorrect credentials or redirecting them to a role-based landing page
function handleLoginSubmission(req, res)
{
  formParse(req, function(formData){
    const uName = formData.textUname || '';
    const pass = formData.textPass || ''; 
    
    // Handle user validation
    credentialModule.validateUser(uName, pass, function(validUserBool, message){      
      console.log("Validation Complete")
      if(validUserBool == true) {
        // Send to role based landing page
        dataBaseModule.getUserFieldData(uName, "accountType", function(accountType){
          userRoleRedirect(res, uName, accountType); 
        });
      } else {
        messageAndReturn(res, message, 4000);
      }
    });
  });
}
// Redirects a user to a page based on their account type
function userRoleRedirect(res, username, accountType)
{
  if(accountType == "viewer")
  {    
    createSessionAndRedirect(res, username, accountType, landingPage);
    console.log("Welcome viewer");
  }
  else if (accountType == "content editor")
  {
    createSessionAndRedirect(res, username, accountType, landingPage);
    console.log("Welcome content editor");
  }
  else if(accountType == "content manager")
  {
    createSessionAndRedirect(res, username, accountType, landingPage);
    console.log("Welcome content manager");
  }
  else  // Unknown account type
  {
    redirectOnSite(res, homePage);
    console.log("Not welcome unknown");
  }
}
// Sends html to the client to create a client side session and then redirects to "location"
function createSessionAndRedirect(res, username, accountType, location)
{
  res.writeHead(200, {'Content-Type': 'text/html'})
  res.write(`
  <!DOCTYPE html>
  <html>
    <body onload=addSessionRole()>Creating session...
    </body>
  </html>
  <script>
      function addSessionRole(){
        console.log("Adding session role");
        sessionStorage.setItem("UserId", "${username}");
        sessionStorage.setItem("AccountType", "${accountType}");    
        console.log("Beginning redirect");
        redirectOnSite();            
      }
      function redirectOnSite()
      {
        console.log("Redirecting");
        window.location.href="/${location}";
      }
  </script>      
  `);
  res.end();
}

// Logs out the user 
function handleLogout(req, res)
{
  var username = url.parse(req.url, true).pathname.split('/')[2];
  credentialModule.logoutUser(username);
  let html = `<!DOCTYPE html>
    <html>
      <head>You have been logged out.</head>
      <body onload="logout()"></body>
    </html>
    <script>
        function logout(){
          sessionStorage.clear();
          setTimeout(function(){
            window.location='/${homePage}';
          }, 1000)
        }
    </script>`;
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(html);
}

// Sign up page #########################################################################

function handleSignUpPage(req, res)
{
    if(req.method === 'GET')
    {
        sendPagehtml(res, signUpPage);
    }
    else if (req.method === 'POST')
    {
        handleSignUpSubmission(req, res);
    }
    else
    {
        console.log("req.method was neither GET nor POST.");
    }
}
// Creates a new user account and logs them in or notifies them to change their username
function handleSignUpSubmission(req, res)
{
  formParse(req, function(formData){
    // User data for account
    const username = formData.txtUsername || '';

    // Checks if there is another username that matches the given username
    dataBaseModule.doesUserExist(username, function(isDuplicateUsername){
      if(isDuplicateUsername)
      {
          var message = 'The username: ' + username + ' has already been used.';
          messageAndReturn(res, message);
      }
      else // Account creation
      {          
          dataBaseModule.addNewUser(formData);
          createSessionAndRedirect(res, username, "viewer", landingPage);
      }
    })    
  });
}


// Reset password page #################################################################

function handlePasswordResetPage(req, res)
{
    if(req.method === 'GET')
    {
      sendPagehtml(res, passwordResetPage);
    }
    else if (req.method === 'POST')
    {
      passwordResetSubmission(req, res);
    }
    else
    {
        console.log("req.method was neither GET nor POST.");
    }
}
// Resets a user's password and redirects to the homepage
function passwordResetSubmission(req, res)
{
  formParse(req, function(formData){
    console.log(formData);
    const username = formData.txtUsername || '';
    const newPassword = formData.txtPassword || '';
    credentialModule.changePassword(username, newPassword);

    redirectOnSite(res, homePage);
  });
}
// Calls code to handle user secuity questions and answers
function securityQuestionsDirecting(usersRequest, req, res)
{
  if(requestedSecurityQuestions(res, usersRequest)){} // Security questions (send questions)    
  else if(sentSecurityQuestionAnswers(req, res, usersRequest)){} // Security questions (receive and check answers)    
  else // No page found
  {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('404 page not found'); 
  }
}
// Security questions (send questions)    
function requestedSecurityQuestions(res, usersRequest)
{
  if(usersRequest[3] == 'questions')
  {
    username = usersRequest[2];    
    dataBaseModule.doesUserExist(username, function(doesExist){
      if(doesExist == false)
      {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write(`er ${username} not found`);
        res.end();     
      }
      else
      {        
        dataBaseModule.getUserFieldData(username, "securityQuestions", function(securityQuestions){ // Get and send questions
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.write('ok\n' +
            securityQuestions["securityQ1"] + ' \n' +
            securityQuestions["securityQ2"] + ' \n' +
            securityQuestions["securityQ3"]
          );
          console.log("Wrote questions");
          res.end();
        });        
      }
    });       
    return true; // This function was the end path (stop if else statements)
  }
  return false; // Continue through to next function
}
// Security questions (receive and check answers) 
function sentSecurityQuestionAnswers(req, res, usersRequest)
{
  if(usersRequest[3] == 'answers')
  {
    username = usersRequest[2];
    var answers = url.parse(req.url, true).query;

    dataBaseModule.getUserFieldData(username, "securityQuestions", function(securityQuestions){
      if(securityQuestions["securityQ1Ans"] == answers.q1 && 
         securityQuestions["securityQ2Ans"] == answers.q2 &&
         securityQuestions["securityQ3Ans"] == answers.q3)
      {
        res.write('correct');
      }
      else
      {
        res.write('bad');
      }
      res.end();
    });   

    return true; // This function was the end path (stop if else statements)
  }
  return false; // Continue through to next function
}


// Video upload page #################################################################

function handleVideoUploadPage(req, res)
{
  if(req.method === 'GET')
  {
    sendPagehtml(res, videoUploadPage);
  }
  else if (req.method === 'POST')
  {
    handleVideoUploadSubmission(req, res);
  }
  else
  {
    console.log("req.method was neither GET nor POST.");
  }
}
// Adds the new video to the database and then redirects
function handleVideoUploadSubmission(req, res)
{
  formParse(req, function(formData){
    dataBaseModule.addNewVideo(formData);    
  });
  redirectOnSite(res, landingPage);
}


// Movies page #################################################################

function handleMoviesPage(req, res)
{
  if(req.method === 'GET')
  {
    sendMoviesPage(res, '', '');
  }
  else if (req.method === 'POST')
  {
    handleVideoSearchSubmission(req, res);
  }
  else
  {
    console.log("req.method was neither GET nor POST.");
  }
}
// Takes the user's search and returns a list of matching movies
function handleVideoSearchSubmission(req, res)
{
  formParse(req, function(formData){
    const titleSearch = formData.videoNameSearch || '';
    const genreSeach = formData.videoGenreSearch || '';

    sendMoviesPage(res, titleSearch, genreSeach);
  });
}
// Send Movies page
function sendMoviesPage(res, titleSearch, genreSeach)
{
  dataBaseModule.getVideos(titleSearch, genreSeach, function(videos){
    videoModule.createVideoList(videos, function(html){
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(html);
      res.end();
    });
  });
}


// Movie watch page #################################################################

function handleVideoPage(req, res)
{
  if(req.method === 'GET')
  {    
    handleVideoPageGET(req, res);
  }
  else if (req.method === 'POST')
  { 
    handleVideoPagePOST(req, res);
  }
  else
  {
    console.log("req.method was neither GET nor POST.");
  }
}

// GET area #################

// Increases the view count when a video's page is first accessed
function incrementVideoViewCount(videoData, callback_argNone)
{
  dataBaseModule.editVideoFieldData(videoData.videoName, "videoViewCount", videoData.videoViewCount + 1, function(){
    callback_argNone();
  });
}
// Sends the video page and handles the following fetch for additional page content
function handleVideoPageGET(req, res)
{
  // localhost:port/video/videoname/"userRole here"
  var userRequest = url.parse(req.url, true).pathname.split('/');
  dataBaseModule.getVideoData(decodeURI(userRequest[2]), function(videoData){
    if(videoData != null){ // If video exists
      if(userRequest.length > 3){ // Fetch response
        handleRoleFetch(userRequest, res, videoData)
      }else{          
        console.log("Sending video");
        incrementVideoViewCount(videoData, function(){
          videoModule.sendVideoPage(res, videoData);
        });
      } 
    }else{ // Video does not exist    
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('404 page not found'); 
    }    
  });
}
// Handles the fetch that is made after the video page is sent
function handleRoleFetch(userRequest, res, videoData)
{
  let userRole = userRequest[3];
  let username = userRequest[4];
  if(username == "null"){
    res.end("sendToLogin");
  }else{
    credentialModule.isLoggedin(username, function(userLoggedIn){
      if(userLoggedIn)
      {
        if(userRole == encodeURI("content manager")) {
          videoPageAddContentManagerNeeds(res, videoData);
        }else if(userRole == encodeURI("content editor")) {
          videoPageAddContentEditorNeeds(res, videoData);
        }else if(userRole == encodeURI("viewer")){
          // Do nothing on fetch
          res.end();
        }else{
          console.log("Unclear user role: " + userRole);
          res.end("sendToLogin");
        }
      }else{
        res.end("sendToLogin");
      }
    });
  }
}
// Adds the video's viewcount and a feedback input field
function videoPageAddContentManagerNeeds(res, videoData){
  res.writeHead(200, {'Content-Type': 'text/html'});
  feedback = videoData.videoFeedback.replace("'", "&#39"); // prevents ' from causing html errors
  html = `
    Video view count: ${videoData.videoViewCount} <br>
    Video Feedback for content editor:<br>
    <form method='post'>
      <textarea id='txtVideoFeedback' type='text' placeholder='${feedback}' name='txtVideoFeedback' rows="5" cols="60"></textarea>
      <button id='btnSubmitFeedback' type='submit'>Submit Feedback</button>
    </form>  
  `;
  res.end(html);
}
// Adds the video feedback and a button for removing the video 
function videoPageAddContentEditorNeeds(res, videoData){
  res.writeHead(200, {'Content-Type': 'text/html'});
  feedback = videoData.videoFeedback;
  html = `
    Video Feedback for content editor:<br>
    <p>${feedback}</p>
    <form method='post'>     
      <button id='btnRemoveVideo' type='submit' name='btnRemoveVideo' value='yes'>Remove Video</button>
    </form> 
  `;
  res.end(html);
}

// POST area #################

// Adds the new feedback to the video in the database or removes the video from the database
function handleVideoPagePOST(req, res)
{  
  formParse(req, function(formData){
    // localhost:port/video/videoname/"userRole here"
    const videoName = decodeURI(url.parse(req.url, true).pathname.split('/')[2]);
    const videoFeedback = formData.txtVideoFeedback || '';
    const removeVideo = formData.btnRemoveVideo || '';
    if(videoFeedback != ''){
      dataBaseModule.editVideoFieldData(videoName, "videoFeedback", videoFeedback, function(){
        // Resend same page
        handleVideoPageGET(req, res);
      });
    }else if(removeVideo == 'yes'){
      dataBaseModule.removeVideo(videoName, function(){
        console.log(`The video "${videoName}" has been removed.`);
        redirectOnSite(res, landingPage);
      });
    }else{
      console.log("handleVideoPagePOST: neither feedback nor video removal.");
      // Resend same page
      handleVideoPageGET(req, res);
    }    
  });
}


// ######################################################################################
// Misc
// ######################################################################################

// Directs to different functions to handle a request about a user
function handleUserInfoQuery(req, res)
{
  var usersRequest = url.parse(req.url, true).pathname.split('/')
  // Security questions
  if(usersRequest[3] == 'questions' || usersRequest[3] == 'answers')
    securityQuestionsDirecting(usersRequest, req, res);
  else if (usersRequest[4] == 'verify') // Handles fetch on videoupload.html
  {
    verifyUserSession(usersRequest, res);
  }
}

// Verifies some user information sent from the client
function verifyUserSession(usersRequest, res)
{
  let username = usersRequest[2];
  if(username == "null") { // No user session on client side
    res.end("sendToLogin");
  } else {
    let accountType = usersRequest[3];
    dataBaseModule.getUserData(username, function(userData){
      if(userData.loggedIn == "loggedIn")
      {
        // If user is valid stay on page
        if(userData.accountType == decodeURI(accountType))
          res.end();
        else
          res.end("sendToLogin");
      }
      else
        res.end("sendToLogin");
    });
  }
}

// Sends the list of genres on request
function sendGenreList(req, res)
{
  dataBaseModule.getGenres(function(genreList){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(JSON.stringify(genreList));
  });
}

// Gets the form data from a submission and passes it to a callback
function formParse(req, callback_formData){
  // Get form data
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  // Parse form data
  req.on('end', function() {
    const formData = querystring.parse(body);
    callback_formData(formData);
  });
}
// Sends the page of filename
function sendPagehtml(res, filename)
{
    // Read the contents of the HTML file and send it back to the client
    fs.readFile(filename, function(err, data) {
        if (err) {
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end('Error reading file');
        } else {
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(data);
        }
    });
}
// Sends the page of filename
function sendImage(res, filename)
{
    // Read the contents of the HTML file and send it back to the client
    fs.readFile(filename, function(err, data) {
        if (err) {
          res.writeHead(500, {'Content-Type': 'text/plain'});
          console.log('Error: failed to send image.');
          res.end('Error reading file');
        } else {
          res.writeHead(200, {'Content-Type': 'image/jpeg'});
          res.end(data);
        }
    });
}
function sendStyleSheet(res, filename) {
  const fileStream = fs.createReadStream(filename);
  fileStream.on('error', function(err) {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    console.log('Error: failed to send stylesheet.');
    res.end('Error reading file');
  });
  res.writeHead(200, {'Content-Type': 'text/css'});
  fileStream.pipe(res);
}
// Redirects to another page on this site
function redirectOnSite(res, page)
{
  res.writeHead(301, {
    Location: `/${page}`
  }).end();
}
// Sends a message to the client and then redirects them to another page after some time
function messageAndReturn(res, message, redirectTimer = 2000)
{
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(
  `<!DOCTYPE html>
  <html>
    <body onload="goBack()">
      <p>${message}</p>
    </body>
  </html>
  <script>
      function goBack(){
          setTimeout(function(){
              history.back();
          }, ${redirectTimer});                
      }
  </script>`
  );
  res.end();
}
