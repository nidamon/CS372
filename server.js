var http = require('http');
var url = require('url');
var fs = require('fs');
const querystring = require('querystring');

var credentialModule = require('./credentialModule');
var dataBaseModule = require('./databaseModule.js');
var videoModule = require('./videoModule');

var domain = "localhost";
var port = 8080;


http.createServer(function (req, res) {
  var q = url.parse(req.url, true);
  console.log("Requested page: " + q.pathname);

  // Page directing
  if(q.pathname == '/' || q.pathname == '/' + getHomePage())    // Homepage
  { sendPagehtml(res, getHomePage()); }
  else if(q.pathname == '/' + getLoginPage())    // Login page
  { handleLoginPage(req, res); }
  else if(q.pathname.split('/')[1] == 'logout')    // Logout
  { handleLogout(req, res); }
  else if(q.pathname == '/' + getSignUpPage())    // Sign up page
  { handleSignUpPage(req, res); }
  else if(q.pathname == '/' + getPasswordResetPage())    // Forgot password page
  { handlePasswordResetPage(req, res); }
  else if(q.pathname == '/' + getLandingPage())    // Landing page
  { handleMoviesPage(req, res); }
  else if(q.pathname == '/' + getVideoUploadPage())    // Video upload page
  { handleVideoUploadPage(req, res); }
  else if(q.pathname.split('/')[1] == 'images') // Check if image request
  { sendjpg(res, "." + q.pathname); }
  else if(q.pathname.split('/')[1] == 'users') // Check if request about users
  {securityQuestionsDirecting(req, res); }
  else if(q.pathname.split('/')[1] == 'video') // Check if request about a video
  {handleVideoPage(req, res); }
  else // No page available
  {        
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end("There is no page at this address.");
  }
}).listen(port); 



// ######################################################################################
// File names 
// ######################################################################################

function getHomePage()
{
  return 'home.html';
}
function getLoginPage()
{
  return 'loginpage.html';
}
function getSignUpPage()
{
  return 'signup.html';
}
function getPasswordResetPage()
{
  return 'passwordreset.html';
}
function getLandingPage()
{
  return 'landingpage' // Page is created dynamically now
}
function getVideoUploadPage()
{
  return 'videoupload.html'
}


// ######################################################################################
// Page handling 
// ######################################################################################


// Login page ###########################################################################

function handleLoginPage(req, res)
{
  if(req.method === 'GET')
  {
    sendPagehtml(res, getLoginPage());
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
    const uname = formData.textUname || '';
    const pass = formData.textPass || ''; 
    
    // Handle user validation
    credentialModule.validateUser(uname, pass, function(validUserBool, message){      
      console.log("Validation Complete")
      if(validUserBool == true)
      {
        // Send to role based landing page
        dataBaseModule.getUserFieldData(uname, "accountType", function(accountType){
          userRoleRedirect(res, uname, accountType); 
        });
      }
      else
      {
        messageAndReturn(res, message, 4000);
      }
    });
  });
}
// Redirects a user to a page based on their account type
function userRoleRedirect(res, username, accountType)
{
  if(accountType == "viewer") // A viewer account
  {    
    createSessionAndRedirect(res, username, accountType, getLandingPage());
    console.log("Welcome viewer");
  }
  else if (accountType == "content editor") // A content editor account
  {
    createSessionAndRedirect(res, username, accountType, getVideoUploadPage());
    console.log("Welcome content editor");
  }
  else if(accountType == "content manager")  // A content manager account
  {
    createSessionAndRedirect(res, username, accountType, getLandingPage());
    console.log("Welcome content manager");
  }
  else  // Unknown account type
  {
    redirectOnSite(res, getHomePage());
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
            window.location='/${getHomePage()}';
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
        sendPagehtml(res, getSignUpPage());
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
          // Tell client that the username needs to change  
          var message = 'The username: ' + username + ' has already been used.';
          messageAndReturn(res, message);
      }
      else // Account creation
      {          
          dataBaseModule.addNewUser(formData); // Create account and log user in 
          createSessionAndRedirect(res, username, "viewer", getLandingPage());
      }
    })    
  });
}


// Reset password page #################################################################

function handlePasswordResetPage(req, res)
{
    if(req.method === 'GET')
    {
      sendPagehtml(res, getPasswordResetPage());
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
    // User data for account
    const username = formData.txtUsername || '';
    const newPassword = formData.txtPassword || '';
    credentialModule.changePassword(username, newPassword);

    // Redirect to homepage
    redirectOnSite(res, getHomePage());
  });
}
// Calls code to handle user secuity questions and answers
function securityQuestionsDirecting(req, res)
{
  var usersRequest = url.parse(req.url, true).pathname.split('/')
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
  if(usersRequest[3] == 'qs') // Security questions (send questions)
  {
    username = usersRequest[2];    
    dataBaseModule.doesUserExist(username, function(doesExist){ // Check if user exists
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
  if(usersRequest[3] == 'ans') // Security questions (receive and check answers)
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
    sendPagehtml(res, getVideoUploadPage());
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
  redirectOnSite(res, getLandingPage());
}


// Movies page #################################################################

function handleMoviesPage(req, res)
{
  if(req.method === 'GET')
  {
    sendMoviesPage(res, '', ''); // Load everything
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
    videoModule.createVideoList(videos, "", function(html){ //use to have getBaseAddress() now ""
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
    if(videoData != null){ // Video exists
      if(userRequest.length > 3){ // Fetch response
        handleRoleFetch(userRequest, res, videoData)
      }else{          
        console.log("Sending video");
        incrementVideoViewCount(videoData, function(){ // Increment view count
          videoModule.sendVideoPage(res, videoData, ""); //use to have getBaseAddress() now ""
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
  let userRole = userRequest[3]; // User's role 
  let username = userRequest[4]; // User's username
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
          res.end("sendToLogin"); // Fetch redirects to login page
        }
      }else{ // User not logged in
        res.end("sendToLogin");
      }
    });
  }
}
// Adds the video's viewcount and a feedback input field
function videoPageAddContentManagerNeeds(res, videoData){
  res.writeHead(200, {'Content-Type': 'text/html'});
  feedback = videoData.videoFeedback.replace("'", "&#39"); // Replacement for adding to html code
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
        redirectOnSite(res, getLandingPage());
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
function sendjpg(res, filename)
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
// Redirects to another page on this site
function redirectOnSite(res, page)
{
  res.writeHead(301, {
    Location: `/${page}`
  }).end();
}
// Redirects to another page anywhere
function redirect(res, page)
{
  res.writeHead(302, {
    Location: `${page}`
  }).end();
}
// Sends a message to the client and then redirects them to another page after some time
function messageAndReturn(res, message, redirectTimer = 2000)
{
  res.writeHead(200, {'Content-Type': 'text/html'});
  // Temporary
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
/*
// Returns the base address of the server
// turns out not necessary to get base add, but function is used
// in multiple location, and will break server if removed.
function getBaseAddress()  
{
  return ``; // returns empty string HOTFIX
  //return `http://${domain}:${port}`;
}
*/