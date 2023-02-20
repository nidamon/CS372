var http = require('http');
var url = require('url');
var fs = require('fs');
const querystring = require('querystring');


// Dictionary of usernames and passwords
var loginCredentials = retrieveLogins();
var domain = "localhost";
var port = 8080;

http.createServer(function (req, res) {
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
  else if(q.pathname == '/' + getLandingPage())    // Forgot password page
  {           
    sendPagehtml(res, getLandingPage());
  }
  else if(q.pathname.split('/')[1] == 'images') // Check if image request
  {
    sendjpg(res, "." + q.pathname);
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
  return 'landingpage.html'
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

    console.log(uname)
    console.log(pass)

    // TEMP ACCESS PAGE
    if (validateUser(uname, pass)){
      // Send to landing page
      sendPagehtml(res, getLandingPage());
    }
    else
    {
      // Notify
      var message = 'The username or password is incorrect.';
      messageAndReturn(res, message);
    }
  });
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
    const firstName = formData.txtFirstName || '';
    const lastName = formData.txtLastName || '';
    const username = formData.txtUsername || '';
    const password = formData.txtPassword || '';
    const email = formData.txtEmail || '';

    const securityQ1 = formData.txtSecureQ1 || '';
    const securityQ1Ans = formData.txtSecureQ1Ans || '';
    const securityQ2 = formData.txtSecureQ2 || '';
    const securityQ2Ans = formData.txtSecureQ2Ans || '';
    const securityQ3 = formData.txtSecureQ3 || '';
    const securityQ3Ans = formData.txtSecureQ3Ans || '';

    // Duplicate username checking
    if(isDuplicateUsername(res, username))
    {
        // Tell client that the username needs to change  
        var message = 'The username: ' + username + ' has already been used.';
        messageAndReturn(res, message);
    }
    else // Account creation
    {
        /* accountText = 
            firstName + ' ' +
            lastName + ' ' +
            username + ' ' +
            password + ' ' +
            email + ' \n' +            
            securityQ1 + ' \n' +
            securityQ1Ans + ' \n' +
            securityQ2 + ' \n' +
            securityQ2Ans + ' \n' +
            securityQ3 + ' \n' +
            securityQ3Ans; */
        
        //console.log(accountText + "\n");

        // Create account and log user in        
        addNewUser(username, password);
        
        // Redirect to homepage
        redirectOnSite(res, getHomePage());
    }
  });
}

// Checks if there is another username that matches the given username
function isDuplicateUsername(res, username)
{
  return loginCredentials[username] != undefined;
}



// Forgot password page #################################################################

function handlePasswordResetPage(req, res)
{
    if(req.method === 'GET')
    {
      sendPagehtml(res, getPasswordResetPage());
    }
    else if (req.method === 'POST')
    {
        
    }
    else
    {
        console.log("req.method was neither GET nor POST.");
    }
}



// ######################################################################################
// Misc
// ######################################################################################

// Gets the logins from a text file
function retrieveLogins() {
  var filename = "UsernamesPasswords.txt";    
  var loginData = fs.readFileSync(filename, 'utf-8', function(err, data) {
      if (err) {
        console.log("Error: login data not found");
        return {};
      }         
      return data;
  });

  // Split file into username and password pairs
  loginData = loginData.split('\n');

  // Create dictionary
  loginDictionary = {};
  for (let index = 0; index < loginData.length; index ++) {
      // Split usernames and passwords
    loginDictionary[loginData[index].split(' ')[0]] = loginData[index].split(' ')[1];          
  }            

  // Set server dictionary of login credentials
  return loginDictionary;    
}; 

function addNewUser(username, password)
{
    fs.appendFile("UsernamesPasswords.txt", '\n' + username + ' ' + password, function(err){
    if (err) throw err;
      console.log("Account created: user=" + username + ", password=" + password);
    });
    loginCredentials[username] = password;
    console.log("Need to add new user account information");
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
          console.log('Sending image.');
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

function messageAndReturn(res, message)
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
          }, 2000);                
      }
  </script>`
  );
  res.end();
}

function getBaseAddress()
{
  return `http://${domain}:${port}`
}


// ######################################################################################
// Validate User Credentials
// Note: to be move to seperate modules
// ######################################################################################

// Validates User credentials
function validateUser(uname, pass){

  if((isValidUsername(uname) == true) && (isPasswordCorrect(uname, pass) == true))
  {
    return true // Exit function
  }
  else
  {
    return false
  }
}

// Checks if username is present in dictionary
function isValidUsername(uname)
{
  if(loginCredentials[uname] == undefined)
  {
    console.log("There is no such username as " + uname);
    return false;
  }
    return true;
}

// Checks if password is correct for the given username
function isPasswordCorrect(uname, pass)
{
  // Does given password match stored password
  console.log("Actual Password: " + loginCredentials[uname]);
  console.log("Given Password:  " + pass);
  if(loginCredentials[uname].localeCompare(pass) == 0)
  {
    console.log("User \"" + uname + "\" has logged in.");
    return true;
  }
    return false;
}
