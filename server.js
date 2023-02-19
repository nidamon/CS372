var http = require('http');
var url = require('url');
var fs = require('fs');
const querystring = require('querystring');

http.createServer(function (req, res) {
    var q = url.parse(req.url, true);

    if(q.pathname == '/' + getLoginPage())    // Login page
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


// Login page ###############################################

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

  // Parse form data
  req.on('end', () => {
    const formData = querystring.parse(body);
    const uname = formData.textUname || '';
    const pass = formData.textpass || '';
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

// Sign up page ###############################################

function handleSignUpPage(req, res)
{
    if(req.method === 'GET')
    {
        sendPage(res, getSignUpPage());
    }
    else if (req.method === 'POST')
    {
        
    }
    else
    {
        console.log("req.method was neither GET nor POST.");
    }
}

// Forgot password page ###############################################

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
    // All of the code in this retrieveLogins can go inside of readfile but it should return the dictionary
    var loginData = fs.readFileSync(filename, 'utf-8', function(err, data) {
        if (err) {
          console.log("Error: data not found");
          res.end("404 Not Found");
          return {};
        }         
        return data;
    });

    console.log(loginData);
    loginData = loginData.split('\r\n');
    console.log("\nSize: " + loginData.length + '\n' + loginData);

    loginDictionary = {};
    for (let index = 0; index < loginData.length; index ++) {
      loginDictionary[loginData[index].split(' ')[0]] = loginData[index].split(' ')[1];          
    }        
    console.log("loginDictionary test u1->p1: " + loginDictionary.u1);
    
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
