var http = require('http');
var url = require('url');
var fs = require('fs');
const querystring = require('querystring');

var credentialModule = require('./credentialModule')
var dataBaseModule = require('./databaseModule.js')
var videoModule = require('./videoModule')

var domain = "localhost";
var port = 8080;


http.createServer(async function (req, res) {
  var q = url.parse(req.url, true);

  console.log("Requested page: " + q.pathname);

  // Page directing
  if(q.pathname == '/' || q.pathname == '/' + getHomePage())    // Homepage
  { 
    sendPagehtml(res, getHomePage());
  }
  else if(q.pathname == '/' + getLoginPage())    // Login page
  {    
    handleLoginPage(req, res);   
  }
  else if(q.pathname == '/' + getSignUpPage())    // Sign up page
  {           
    handleSignUpPage(req, res);
  }
  else if(q.pathname == '/' + getPasswordResetPage())    // Forgot password page
  {           
    handlePasswordResetPage(req, res);
  }
  else if(q.pathname == '/' + getLandingPage())    // Forgot Landing Page page
  {           
    //sendPagehtml(res, getLandingPage());
    dataBaseModule.getVideos("","Lofi", function(videos){
      videoModule.createVideoList(videos,function(html){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(html);
        res.end();
      });});
  }
  else if(q.pathname == '/' + getVideoUploadPage())    // Video upload page
  {           
    handleVideoUploadPage(req, res);
  }
  else if(q.pathname.split('/')[1] == 'images') // Check if image request
  {
    sendjpg(res, "." + q.pathname);
  }
  else if(q.pathname.split('/')[1] == 'users') // Check if request about users
  {
    var usersRequest = q.pathname.split('/')
    if(requestedSecurityQuestions(res, usersRequest)){} // Security questions (send questions)    
    else if(sentSecurityQuestionAnswers(req, res, usersRequest)){} // Security questions (receive and check answers)    
    else // No page found
    {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('404 page not found'); 
    }
  }
  else // No page available
  {        
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.write("There is no page at this address.");
    res.end();
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
  return 'landingpage'
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

function handleLoginSubmission(req, res)
{
  // Get form data
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  // Parse form data
  req.on('end', function() {
    const formData = querystring.parse(body);
    const uname = formData.textUname || '';
    const pass = formData.textPass || ''; 
    
    // Handle user validation
    credentialModule.validateUser(uname, pass, function(validUserBool, message){      
      console.log("Validation Complete")
      if(validUserBool == true)
      {
        // Send to role based landing page
        dataBaseModule.getUserFieldData(uname, "accountType", function(accountType){
          userRoleRedirect(res, accountType);   
        });
      }
      else
      {
        messageAndReturn(res, message, 4000);
      }
    });
  });
}

async function userRoleRedirect(res, accountType)
{
  if(accountType == "viewer") // A viewer account
  {
    redirectOnSite(res, getLandingPage());
    console.log("Welcome viewer");
  }
  else if (accountType == "content editor") // A content editor account
  {
    redirectOnSite(res, getVideoUploadPage());
    console.log("Welcome content editor");
  }
  else if(accountType == "content manager")  // A content manager account
  {
    redirectOnSite(res, getLandingPage());
    console.log("Welcome content manager");
  }
  else  // Unknown account type
  {
    redirectOnSite(res, getLandingPage());
    console.log("Not welcome unknown");
  }
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

function handleSignUpSubmission(req, res)
{
  // Get form data
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  // Parse form data
  req.on('end', () => {
    const formData = querystring.parse(body);

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
          // Create account and log user in  
          dataBaseModule.addNewUser(formData);
          
          // Redirect to homepage
          redirectOnSite(res, getHomePage());
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

function passwordResetSubmission(req, res)
{
  // Get form data
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  // Parse form data
  req.on('end', () => {
    const formData = querystring.parse(body);

    console.log(formData);
    // User data for account
    const username = formData.txtUsername || '';
    const newPassword = formData.txtPassword || '';
    credentialModule.changePassword(username, newPassword);

    // Redirect to homepage
    redirectOnSite(res, getHomePage());
  });
}

// Security questions (send questions)    
function requestedSecurityQuestions(res, usersRequest)
{
  if(usersRequest[3] == 'qs') // Security questions (send questions)
  {
    username = usersRequest[2];
    console.log('Checking if user ' + username + ' exists');
    // Check if user exists
    dataBaseModule.doesUserExist(username, function(doesExist){
      if(doesExist == false)
      {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write(`er ${username} not found`);
        res.end();     
      }
      else
      {
        console.log('User ' + username + ' exists');
        // Get and send questions
        dataBaseModule.getUserFieldData(username, "securityQuestions", function(securityQuestions){
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

function handleVideoUploadSubmission(req, res)
{
  // Get form data
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  // Parse form data
  req.on('end', () => {
    const formData = querystring.parse(body);
    dataBaseModule.addNewVideo(formData);    
  });
  redirectOnSite(res, getLandingPage());
}

// ######################################################################################
// Misc
// ######################################################################################


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
    Location: `${getBaseAddress()}/${page}`
  }).end();
}
// Redirects to another page anywhere
function redirect(res, page)
{
  res.writeHead(302, {
    Location: `${page}`
  }).end();
}

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

function getBaseAddress()
{
  return `http://${domain}:${port}`;
}
