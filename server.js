var http = require('http');
var url = require('url');
var fs = require('fs');
const querystring = require('querystring');

http.createServer(function (req, res) {
    var q = url.parse(req.url, true);

    console.log("Requested page: " + q.pathname);

    // Page directing
    if(q.pathname == '/' || q.pathname == '/' + getHomePage())    // Homepage
    {    
        sendPage(res, getHomePage());
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
    else // No page available
    {        
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write("There is no page at this address.");
        res.end();
    }
}).listen(8080); 



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



// ######################################################################################
// Page handling 
// ######################################################################################


// Login page ###########################################################################

function handleLoginPage(req, res)
{
    if(req.method === 'GET')
    {
        sendPage(res, getLoginPage());
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

  // TODO: Fix
  // Parse form data
  req.on('end', () => {
    const formData = querystring.parse(body);
    const uname = formData.textUname || '';
    const pass = formData.textPass || '';
    console.log(uname)
    console.log(pass)

    // Returned response
    const html = `<!DOCTYPE html>
      <html>
        <head>
          <title>Node.js Server Response</title>
        </head>
        <body>
          <p>You entered for username: ${uname}</p>
          <p>You entered for password: ${pass}</p>
        </body>
      </html>`;



    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
  });
}



// Sign up page #########################################################################

function handleSignUpPage(req, res)
{
    if(req.method === 'GET')
    {
        console.log("Get sign up page");
        sendPage(res, getSignUpPage());
    }
    else if (req.method === 'POST')
    {
        console.log("Handle sign up submission");
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
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Sign Up</title>
          </head>
          <body onload="goBack()">
            <p>The username: ${username} has already been used.</p>
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
        fs.appendFile("UsernamesPasswords.txt", '\n' + username + ' ' + password, function(err){
            if (err) throw err;
            console.log("Account created: user=" + username + ", password=" + password);
        });
        console.log("Need to add new user account information");

        
        // Redirect to homepage
        redirect(res, getHomePage());
    }
  });
}

// Checks if there is another username that matches the given username
function isDuplicateUsername(res, username)
{
    return retrieveLogins(res)[username] != undefined;
}



// Forgot password page #################################################################

function handlePasswordResetPage(req, res)
{
    if(req.method === 'GET')
    {
        sendPage(res, getPasswordResetPage());
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
function retrieveLogins(res) {
    var filename = "UsernamesPasswords.txt";    
    var loginData = fs.readFileSync(filename, 'utf-8', function(err, data) {
        if (err) {
          console.log("Error: data not found");
          res.end("404 Not Found");
          return {};
        }         
        return data;
    });

    // Split file into username and password pairs
    loginData = loginData.split('\r\n');

    // Create dictionary
    loginDictionary = {};
    for (let index = 0; index < loginData.length; index ++) {
        // Split usernames and passwords
      loginDictionary[loginData[index].split(' ')[0]] = loginData[index].split(' ')[1];          
    }            
    return loginDictionary;
}; 

// Sends the page of filename
function sendPage(res, filename)
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

// Redirects to another page
function redirect(res, page)
{
    res.write(
        `<html>
            <head>
                <meta http-equiv="refresh" content="0; url=${page}" />
            </head>
        </html>`
    );
    res.end();
}
